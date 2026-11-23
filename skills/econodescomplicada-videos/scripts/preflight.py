#!/usr/bin/env python3
"""Read-only, cross-platform environment check for Econo Descomplicada videos.

Does NOT install packages, contact the network, generate images, render videos or
access Drive. Returns 0 if all hard requirements for the selected stage are found,
2 otherwise. The external #07 engine and project assets are NOT included in this repo.
"""
import argparse
import importlib.util
import json
import os
import platform
import shutil
import sys
from pathlib import Path

REQUIRED_SPRITES = ("moeda_acena.png", "moeda_aponta.png", "moeda_feliz.png", "moeda_assustada.png")
PATH_NAMES = ("workspace", "engine", "episode_template", "sprites", "style_reference", "checker_script", "browser")
ENV_PATHS = {
    "workspace": "ECONO_WORKSPACE",
    "engine": "ECONO_ENGINE_DIR",
    "episode_template": "ECONO_TEMPLATE_DIR",
    "sprites": "ECONO_SPRITES_DIR",
    "style_reference": "ECONO_STYLE_REFERENCE",
    "checker_script": "ECONO_CHECKER_SCRIPT",
    "browser": "ECONO_BROWSER_PATH",
}


def default_config_path():
    return Path(os.environ.get("ECONO_CONFIG") or Path(__file__).resolve().parents[1] / "config.example.json")


def resolve_path(value, config_dir):
    if not value or not isinstance(value, str):
        return None
    candidate = Path(os.path.expandvars(os.path.expanduser(value)))
    if not candidate.is_absolute():
        candidate = config_dir / candidate
    return candidate.resolve(strict=False)


def load_config(path, environ=None):
    """Resolve relative paths against config location, not the agent's cwd."""
    env = os.environ if environ is None else environ
    path = Path(path).expanduser().resolve()
    try:
        source = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise ValueError(f"Cannot read config {path}: {exc}") from exc
    if not isinstance(source, dict):
        raise ValueError("Config must be a JSON object")
    paths = source.get("paths", {})
    production = source.get("production", {})
    archive = source.get("archive", {})
    if not all(isinstance(group, dict) for group in (paths, production, archive)):
        raise ValueError("'paths', 'production' and 'archive' must be objects")
    resolved = {}
    for name in PATH_NAMES:
        value = env.get(ENV_PATHS[name], paths.get(name, ""))
        if value and not isinstance(value, str):
            raise ValueError(f"paths.{name} must be a string")
        resolved[name] = resolve_path(value, path.parent)
    workers = env.get("ECONO_RENDER_WORKERS", production.get("render_workers", "auto"))
    if str(workers) == "auto":
        # Conservative default suited to CPUs with and without strong graphics.
        workers = min(4, max(1, (os.cpu_count() or 2) // 2))
    else:
        try:
            workers = int(workers)
        except (TypeError, ValueError) as exc:
            raise ValueError("render_workers must be 'auto' or a positive integer") from exc
        if workers < 1 or workers > 32:
            raise ValueError("render_workers must be between 1 and 32")
    image_backend = env.get("ECONO_IMAGE_BACKEND", production.get("image_backend", "codex-image"))
    tts_backend = env.get("ECONO_TTS_BACKEND", production.get("tts_backend", "edge-tts"))
    archive_mode = env.get("ECONO_ARCHIVE_MODE", archive.get("mode", "local"))
    drive_folder_id = env.get("ECONO_DRIVE_FOLDER_ID", archive.get("drive_folder_id", ""))
    if image_backend not in ("codex-image", "external"):
        raise ValueError("image_backend must be 'codex-image' or 'external'")
    if tts_backend not in ("edge-tts", "external"):
        raise ValueError("tts_backend must be 'edge-tts' or 'external'")
    if archive_mode not in ("local", "google-drive"):
        raise ValueError("archive.mode must be 'local' or 'google-drive'")
    if not isinstance(drive_folder_id, str):
        raise ValueError("drive_folder_id must be a string")
    return {
        "config_file": str(path),
        "paths": resolved,
        "production": {
            "render_workers": workers,
            "image_backend": image_backend,
            "tts_backend": tts_backend,
        },
        "archive": {"mode": archive_mode, "drive_folder_id": drive_folder_id},
    }


def find_browser(configured=None):
    if configured:
        return str(configured) if configured.is_file() else None
    env = os.environ.get("CHROME_PATH") or os.environ.get("PUPPETEER_EXECUTABLE_PATH")
    if env and Path(env).expanduser().is_file():
        return str(Path(env).expanduser())
    for name in ("chromium", "chromium-browser", "google-chrome", "google-chrome-stable", "chrome", "msedge"):
        candidate = shutil.which(name)
        if candidate:
            return candidate
    candidates = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
        "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
        "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    ]
    return next((p for p in candidates if Path(p).is_file()), None)


def inspect(config, stage="plan"):
    """Return structured report with hard failures and actionable warnings."""
    if stage not in ("plan", "render", "publish"):
        raise ValueError("stage must be plan, render or publish")
    p = config["paths"]
    prod = config["production"]
    result = {
        "stage": stage,
        "host": {"os": platform.system(), "architecture": platform.machine(), "python": platform.python_version()},
        "render_workers": prod["render_workers"],
        "paths": {key: str(val) if val else None for key, val in p.items()},
        "checks": [],
        "errors": [],
        "warnings": [],
    }

    def check(name, ok, detail, required=True):
        result["checks"].append({"name": name, "ok": bool(ok), "detail": detail, "required": required})
        if not ok:
            (result["errors"] if required else result["warnings"]).append(f"{name}: {detail}")

    # A writing-only episode can be planned on any platform with Python.
    workspace = p["workspace"]
    check("workspace", bool(workspace), "Set paths.workspace in local config or ECONO_WORKSPACE", required=True)
    if workspace and workspace.exists() and not workspace.is_dir():
        check("workspace_is_directory", False, f"{workspace} is not a directory")
    if stage == "plan":
        result["ready"] = not result["errors"]
        return result

    for label, name in (("engine", "engine"), ("episode_template", "episode_template"), ("sprites", "sprites")):
        path = p[name]
        check(label, bool(path and path.is_dir()), f"Set paths.{name} to an existing directory")
    sprites = p["sprites"]
    for name in REQUIRED_SPRITES:
        check("sprite:" + name, bool(sprites and (sprites / name).is_file()),
              "Required source sprite absent from configured sprites directory")

    # Renderer is third-party and intentionally NOT bundled in this skill.
    engine, template = p["engine"], p["episode_template"]
    has_renderer = any(base and (base / "render_paralelo.mjs").is_file() for base in (engine, template))
    check("renderer", has_renderer, "Missing render_paralelo.mjs in engine or episode_template")

    for command in ("node", "npm", "ffmpeg", "ffprobe"):
        check("command:" + command, bool(shutil.which(command)), f"Install {command} and add it to PATH")
    browser = find_browser(p["browser"])
    check("browser", bool(browser), "Install Chrome/Chromium or set paths.browser / ECONO_BROWSER_PATH")

    # Alternative providers are supported as manual integrations, not falsely verified.
    if prod["tts_backend"] == "edge-tts":
        try:
            tts_available = importlib.util.find_spec("edge_tts") is not None
        except (ImportError, ValueError):
            tts_available = False
        check("tts:edge-tts", tts_available, "Install edge-tts in the active Python environment")
    else:
        check("tts:external", False, "Verify external narration and WordBoundary-compatible word timestamps manually", required=False)
    if prod["image_backend"] == "codex-image":
        check("image:codex", bool(shutil.which("codex")),
              "Install/login Codex CLI and install the separate codex-image skill")
    else:
        check("image:external", False, "Verify another image generator and 9:16 reference support manually", required=False)

    if p["style_reference"]:
        check("style_reference", p["style_reference"].exists(),
              "Configured style reference file is missing", required=False)
    else:
        check("style_reference", False, "Provide a visual style reference before generating plates", required=False)
    if stage == "publish":
        check("checker_script", bool(p["checker_script"] and p["checker_script"].is_file()),
              "Set paths.checker_script to the available checar-video checker")
        if config["archive"]["mode"] == "google-drive":
            check("drive_folder", bool(config["archive"]["drive_folder_id"]),
                  "Set ECONO_DRIVE_FOLDER_ID locally (do not publish it in Git)")
            check("drive_connector", False,
                  "Drive connection and permissions must be verified by the agent at publishing time", required=False)
        else:
            check("archive_local", True,
                  "Local delivery is configured; cloud upload is not automatic")
    result["ready"] = not result["errors"]
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description="Check portable Econo video environment (read-only)")
    parser.add_argument("--config", type=Path, default=default_config_path())
    parser.add_argument("--stage", choices=("plan", "render", "publish"), default="plan")
    parser.add_argument("--json", action="store_true", help="machine-readable result, without secrets")
    args = parser.parse_args(argv)
    try:
        cfg = load_config(args.config)
        report = inspect(cfg, stage=args.stage)
    except ValueError as exc:
        print(f"CONFIG_ERROR: {exc}", file=sys.stderr)
        return 2
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        print(f"Stage: {report['stage']} | Host: {report['host']['os']} {report['host']['architecture']} | Workers: {report['render_workers']}")
        for item in report["checks"]:
            print(f"{'OK' if item['ok'] else 'FAIL' if item['required'] else 'WARN'} {item['name']}: {item['detail']}")
        print("READY" if report["ready"] else "NOT_READY")
    return 0 if report["ready"] else 2


if __name__ == "__main__":
    sys.exit(main())
