#!/usr/bin/env python3
"""Generate or edit one image with the Codex CLI's built-in image tool (ChatGPT login, no API key).

The script asks `codex exec` to call its built-in image_gen tool exactly once, finds the PNG
Codex saved under $CODEX_HOME/generated_images/<thread>/, and copies it to the path you choose.

Usage:
  python3 codex_image.py "<prompt>" -o out.png [--aspect 9:16] [--ref a.png --ref b.png]
  python3 codex_image.py --prompt-file spec.json -o out.png --aspect 4:5 --crop
  python3 codex_image.py --quota          # last known usage of the Codex plan, generates nothing

Output (stdout), one item per line:
  SAVED <path>            the image that was saved
  SIZE <w>x<h>            pixel size of the saved file
  SOURCE <path>           original file under $CODEX_HOME/generated_images
  UNCROPPED <path>        with --crop: the full original canvas (same as SOURCE)
  QUOTA <text>            when a threshold (50%, 25%, 10%, 5% left) is crossed, or with --quota
  LIMIT_REACHED <text>    the Codex usage limit is over (exit code 4)
  TIME <s>s               wall time

Exit codes: 0 ok, 1 no image / refused, 2 not logged in, 3 codex missing,
            4 usage limit reached, 5 timeout.

No paid API is used: everything goes through the ChatGPT plan that Codex is logged in with,
and shares that plan's Codex usage limits with normal Codex work.
"""
import argparse
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from datetime import datetime
from pathlib import Path

CODEX_HOME = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex"))
STATE_DIR = Path(os.environ.get("CODEX_IMAGE_HOME", Path.home() / ".codex-image-skill"))
STATE_FILE = STATE_DIR / "quota_state.json"
THRESHOLDS = (50, 25, 10, 5)
LIMIT_WORDS = ("usage limit", "rate limit", "rate_limit", "hit your limit", "quota", "too many requests", "429")

# The built-in tool picks its canvas from the prompt; these are the sizes it produces.
ASPECTS = {
    "1:1": ("square", "1024x1024"),
    "2:3": ("portrait", "1024x1536"), "9:16": ("portrait", "1024x1536"),
    "3:4": ("portrait", "1024x1536"), "4:5": ("portrait", "1024x1536"),
    "3:2": ("landscape", "1536x1024"), "16:9": ("landscape", "1536x1024"),
    "4:3": ("landscape", "1536x1024"), "5:4": ("landscape", "1536x1024"),
}


def fail(code, msg):
    print(msg, file=sys.stderr)
    sys.exit(code)


# --------------------------------------------------------------------------- quota
def latest_rate_limits(rollout=None):
    """Read the newest rate_limits block Codex wrote to a session file (server-reported)."""
    files = [rollout] if rollout else sorted(
        glob.glob(str(CODEX_HOME / "sessions" / "*" / "*" / "*" / "*.jsonl")),
        key=os.path.getmtime, reverse=True)[:5]
    for f in files:
        if not f or not os.path.exists(f):
            continue
        found = None
        with open(f, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                if '"rate_limits"' not in line:
                    continue
                try:
                    d = json.loads(line)
                except ValueError:
                    continue
                rl = (d.get("payload") or {}).get("rate_limits")
                if rl:
                    found = rl
        if found:
            return found
    return None


def fmt_window(w):
    left = max(0.0, 100.0 - float(w.get("used_percent") or 0))
    mins = w.get("window_minutes") or 0
    name = "5h" if mins == 300 else ("weekly" if mins == 10080 else f"{mins}min")
    reset = w.get("resets_at")
    when = datetime.fromtimestamp(reset).strftime("%Y-%m-%d %H:%M") if reset else "?"
    return left, f"{name}: {left:.0f}% left, resets {when} (local time)"


def report_quota(rl, force=False):
    """Print QUOTA lines when a threshold is crossed (once per window), or always with force."""
    if not rl:
        if force:
            print("QUOTA unavailable (no Codex session has reported usage yet)")
        return False
    try:
        state = json.loads(STATE_FILE.read_text())
    except Exception:
        state = {}
    limit_hit = bool(rl.get("rate_limit_reached_type"))
    for key in ("primary", "secondary"):
        w = rl.get(key)
        if not w:
            continue
        left, text = fmt_window(w)
        if left <= 0:
            limit_hit = True
        if force:
            print(f"QUOTA {text}")
            continue
        wid = f"{key}:{w.get('resets_at')}"
        seen = state.get(wid, [])
        hit = [t for t in THRESHOLDS if left <= t and t not in seen]
        if hit:
            print(f"QUOTA {text}  (crossed the {min(hit)}% mark)")
            state[wid] = sorted(set(seen) | set(hit))
    if rl.get("plan_type") and force:
        print(f"QUOTA plan: {rl['plan_type']}")
    try:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(json.dumps(state))
    except Exception:
        pass
    return limit_hit


# --------------------------------------------------------------------------- prompt
def build_prompt(args):
    if args.prompt_file:
        text = Path(args.prompt_file).read_text(encoding="utf-8").strip()
    else:
        text = (args.prompt or "").strip()
    if not text:
        fail(1, "Give a prompt or --prompt-file")
    lines = [
        "Call your built-in image generation tool (image_gen) exactly ONCE to create the image "
        "described below, then reply with the single word DONE.",
        "Do not run shell commands, do not read or write files, do not ask questions, "
        "do not rewrite the brief into something different: pass it on faithfully.",
    ]
    if args.aspect:
        orient, size = ASPECTS[args.aspect]
        lines.append(f"Target aspect ratio {args.aspect} ({orient}); if that exact ratio is not "
                     f"available, use the {orient} canvas {size}.")
        if args.crop:
            cw, ch = (int(x) for x in size.split("x"))
            a, b = (float(x) for x in args.aspect.split(":"))
            keep = min(1.0, (a / b) / (cw / ch)) if cw / ch > a / b else min(1.0, (b / a) / (ch / cw))
            if keep < 0.99:
                side = "left and right" if cw / ch > a / b else "top and bottom"
                # Extra inner margin so limbs/hands do not touch the cut edge.
                safe = max(0.5, keep - 0.14)
                lines.append(
                    f"IMPORTANT FRAMING: the image may be center-cropped to {args.aspect}; up to the outer "
                    f"{(1 - keep) * 50:.0f} percent on the {side} edges may be cut away. Keep the subject "
                    f"COMPLETE (all limbs, hands, feet, props, devices) inside the central "
                    f"{safe * 100:.0f} percent ({side}), so that after the crop there is still a clear "
                    f"background margin of at least {(keep - safe) * 50 / keep:.0f} percent of "
                    f"the final frame between the subject and every edge. Nothing may touch or cross "
                    f"the {side} edges; any arms or hands stay well inside the frame.")
    if args.transparent:
        lines.append("Use a genuinely transparent background (transparent_background true).")
    if args.ref:
        lines.append(
            f"{len(args.ref)} reference image(s) are attached, numbered in order (image 1 = first). "
            "Use them exactly as the brief says; if the brief asks for an edit, keep everything "
            "it does not ask to change.")
    lines.append("\nBRIEF:\n" + text)
    return "\n".join(lines)


# --------------------------------------------------------------------------- run
def find_rollout(thread_id):
    hits = glob.glob(str(CODEX_HOME / "sessions" / "*" / "*" / "*" / f"*{thread_id}.jsonl"))
    return max(hits, key=os.path.getmtime) if hits else None


def images_from_rollout(rollout):
    out, failures = [], []
    if not rollout:
        return out, failures
    with open(rollout, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            if "image_gen" not in line:
                continue
            try:
                item = (json.loads(line).get("payload") or {}).get("item") or {}
            except ValueError:
                continue
            if not str(item.get("kind", "")).startswith("image_gen"):
                continue
            if item.get("savedPath") and item.get("status") == "completed":
                out.append(item["savedPath"])
            elif item.get("failure"):
                failures.append(str(item["failure"]))
    return out, failures


def unique_path(p: Path, force: bool) -> Path:
    if force or not p.exists():
        return p
    i = 2
    while True:
        q = p.with_name(f"{p.stem}-v{i}{p.suffix}")
        if not q.exists():
            return q
        i += 1


def crop_to_aspect(path: Path, aspect: str):
    try:
        from PIL import Image
    except ImportError:
        print("WARN --crop needs Pillow (pip install pillow); kept the original canvas", file=sys.stderr)
        return
    a, b = (float(x) for x in aspect.split(":"))
    im = Image.open(path)
    w, h = im.size
    target = a / b
    if abs(w / h - target) < 0.01:
        return
    if w / h > target:
        nw = int(round(h * target)); box = ((w - nw) // 2, 0, (w - nw) // 2 + nw, h)
    else:
        nh = int(round(w / target)); box = (0, (h - nh) // 2, w, (h - nh) // 2 + nh)
    im.crop(box).save(path)


def main():
    p = argparse.ArgumentParser(description="Generate/edit one image with Codex's built-in image tool")
    p.add_argument("prompt", nargs="?")
    p.add_argument("--prompt-file")
    p.add_argument("-o", "--out")
    p.add_argument("--aspect", choices=sorted(ASPECTS))
    p.add_argument("--crop", action="store_true", help="center-crop to the exact --aspect (needs Pillow)")
    p.add_argument("--ref", action="append", default=[], help="reference / edit image (repeatable)")
    p.add_argument("--transparent", action="store_true")
    p.add_argument("--model", help="Codex model (default: your config.toml model)")
    p.add_argument("--effort", default="low", help="reasoning effort for the wrapper turn (default low)")
    p.add_argument("--timeout", type=int, default=600)
    p.add_argument("--force", action="store_true", help="overwrite -o instead of writing name-v2.png")
    p.add_argument("--quota", action="store_true", help="print the last known Codex usage and exit")
    p.add_argument("--verbose", action="store_true")
    args = p.parse_args()

    codex = shutil.which("codex") or str(Path.home() / ".local/bin/codex")
    if not os.path.exists(codex):
        fail(3, "codex CLI not found (npm i -g @openai/codex, then `codex login`)")

    if args.quota:
        report_quota(latest_rate_limits(), force=True)
        return
    if not args.out:
        p.error("-o/--out is required unless --quota is used")
    if args.crop and not args.aspect:
        p.error("--crop needs --aspect")
    for r in args.ref:
        if not os.path.isfile(r):
            fail(1, f"reference not found: {r}")

    st = subprocess.run([codex, "login", "status"], capture_output=True, text=True)
    if st.returncode != 0 or "Logged in" not in (st.stdout + st.stderr):
        fail(2, "Codex is not logged in. Run `codex login` (ChatGPT account) and try again.")

    # Stop early if the server already said the limit is over.
    rl = latest_rate_limits()
    if rl and (rl.get("rate_limit_reached_type") or any(
            float((rl.get(k) or {}).get("used_percent") or 0) >= 100
            and (rl.get(k) or {}).get("resets_at", 0) > time.time() for k in ("primary", "secondary"))):
        print("LIMIT_REACHED Codex usage limit already reached; see --quota for the reset time")
        sys.exit(4)

    cmd = [codex, "exec", "--json", "--skip-git-repo-check", "-s", "read-only",
           "-c", f'model_reasoning_effort="{args.effort}"']
    if args.model:
        cmd += ["-m", args.model]
    for r in args.ref:
        cmd += ["-i", os.path.abspath(r)]
    cmd += ["--", build_prompt(args)]

    started = time.time()
    workdir = tempfile.mkdtemp(prefix="codex-image-")
    try:
        proc = subprocess.run(cmd, cwd=workdir, stdin=subprocess.DEVNULL, capture_output=True,
                              text=True, timeout=args.timeout)
    except subprocess.TimeoutExpired:
        fail(5, f"Timed out after {args.timeout}s. Check --quota; do not loop.")
    finally:
        shutil.rmtree(workdir, ignore_errors=True)

    thread_id, errors, last_msg = None, [], ""
    for line in proc.stdout.splitlines():
        try:
            ev = json.loads(line)
        except ValueError:
            continue
        t = ev.get("type", "")
        if t == "thread.started":
            thread_id = ev.get("thread_id")
        elif t in ("error", "turn.failed"):
            errors.append(json.dumps(ev.get("error") or ev.get("message") or ev))
        elif t == "item.completed" and (ev.get("item") or {}).get("type") == "agent_message":
            last_msg = ev["item"].get("text", "")
    if args.verbose:
        print(proc.stderr[-3000:], file=sys.stderr)

    rollout = find_rollout(thread_id) if thread_id else None
    rl = latest_rate_limits(rollout) if rollout else None
    limit_hit = report_quota(rl)
    blob = " ".join(errors).lower()
    if errors and any(w in blob for w in LIMIT_WORDS):
        print(f"LIMIT_REACHED {' | '.join(errors)[:400]}")
        sys.exit(4)

    saved, failures = images_from_rollout(rollout)
    if not saved and thread_id:  # fallback: newest PNG in the thread's folder
        saved = sorted(glob.glob(str(CODEX_HOME / "generated_images" / thread_id / "*.png")),
                       key=os.path.getmtime)
    if not saved:
        why = " | ".join(failures or errors) or (last_msg[:400] if last_msg else f"codex exit {proc.returncode}")
        if limit_hit:
            print(f"LIMIT_REACHED {why}")
            sys.exit(4)
        fail(1, f"No image generated. {why}")

    src = Path(saved[-1])
    out = unique_path(Path(args.out), args.force)
    out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, out)
    if args.crop:
        crop_to_aspect(out, args.aspect)
    print(f"SAVED {out}")
    try:
        from PIL import Image
        w, h = Image.open(out).size
        print(f"SIZE {w}x{h}")
    except Exception:
        pass
    print(f"SOURCE {src}")
    if args.crop:
        print(f"UNCROPPED {src}")
    print(f"TIME {time.time() - started:.0f}s")


if __name__ == "__main__":
    main()
