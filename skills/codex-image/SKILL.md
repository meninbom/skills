---
name: codex-image
description: Generate or edit raster images (illustrations, mascots, banners, product shots, mockups, Reel stills) with the Codex CLI's built-in image tool through the user's ChatGPT login, with no API key and no paid API. Use when the user asks to create, generate, edit or refine an image, or when a project needs a visual asset that code or SVG cannot produce. The agent writes the brief, runs one command, looks at the result and iterates.
---

# Codex Image (built-in Codex image tool, driven by an AI agent)

You do not draw the pixels. You are the **art director**: turn the request into a precise brief, run the script, **look at the image**, and decide whether to redo it.

The script is `scripts/codex_image.py` in this skill's directory (Python 3 stdlib; Pillow optional for `--crop` and `SIZE`). It calls `codex exec` once, Codex calls its built-in `image_gen` tool once, and the script copies the PNG from `$CODEX_HOME/generated_images/<thread>/` to the path you choose. **Run it yourself, directly, from the shell.** Do not hand it to a sub-agent. One image takes about 20–40 s.

## Workflow

1. **Understand the request.** If something that changes the result is missing (final use, aspect ratio, style, text in the image, references), ask first. Every image uses the plan's Codex usage limits.
2. **Write the brief in English, with numbers.** Include subject, medium/style, composition, lighting, palette (hex codes if the project has them), and what you do NOT want. Put any text that must appear in quotes and keep it short.
3. **Run the script.**
   ```bash
   python3 "<skill-dir>/scripts/codex_image.py" "<brief>" -o assets/name.png --aspect 9:16 --crop
   python3 "<skill-dir>/scripts/codex_image.py" --prompt-file brief.txt -o assets/name.png --aspect 4:5 --ref ref1.png --ref ref2.png
   ```
   For long or complex briefs, write a text or JSON file and use `--prompt-file`, because quotes break on the command line.
4. **Look at the result yourself.** Open the saved file with a tool that can show images. Judge composition, readable text, artifacts, hands, cropped limbs, and how well it matches the brief. Be honest with the user about what is wrong.
5. **Iterate 2–3 times at most.** For a small fix, pass the previous image with `--ref` and ask only for the change ("Edit image 1. Change only X; keep Y unchanged"). Then show the user and ask.
6. **Save assets inside the project** (`assets/`, `public/`, `docs/`), never loose in the root. The script never overwrites a file: it writes `name-v2.png` unless you pass `--force`.

## Reading the script output

| Line | Meaning | What to do |
|---|---|---|
| `SAVED <path>` | image saved | open it and look |
| `SIZE <w>x<h>` | pixel size of the saved file | check it fits the use |
| `SOURCE <path>` / `UNCROPPED <path>` | original under `$CODEX_HOME/generated_images` (full canvas before `--crop`) | use as `--ref` for the next edit |
| `QUOTA <text>` | a usage window crossed 50/25/10/5 % left | **tell the user in one short sentence**, then continue |
| `LIMIT_REACHED <text>` | the Codex usage limit is over (exit 4) | stop, tell the user when it resets, do not retry |

Exit codes: `0` ok; `1` no image or refused (read the message); `2` not logged in (`codex login`), or a bad command line; `3` codex CLI missing; `4` usage limit reached; `5` timeout. On `2`, `3` or `4`, take the problem to the user instead of retrying.

Before a batch of more than about 6 images, run `python3 <skill-dir>/scripts/codex_image.py --quota` and tell the user how much is left. It generates nothing. It prints the most recent usage snapshot Codex received from the server (5-hour window, weekly window and plan), so it is only as fresh as the last Codex run.

## Sizes and aspect

The built-in tool has no size parameter: it picks the canvas from the prompt. The script asks for the exact ratio and names a fallback canvas. Observed outputs (2026-11-20): 1024×1024, 1024×1536 / 1536×1024, and sometimes native 16:9 / 9:16 at 1672×941 / 941×1672.

- `--aspect` adds the ratio hint (`1:1`, portrait `2:3 3:4 4:5 9:16`, landscape `3:2 4:3 5:4 16:9`).
- `--crop` center-crops to the exact aspect if the canvas came out different (2:3 → 9:16 gives 864×1536). It also tells the model to keep the whole subject inside the central 70 % on the side that may be cut, so limbs, hands and devices keep a clear margin from the edges.
- For 1080×1920 Reels, upscale afterwards (ffmpeg, Real-ESRGAN, etc.). The model does not output 1080p natively.

## Brief lessons

- **Numbers beat adjectives.** "Close-up" is vague. Say "the body fills about 45 % of the frame height", "camera about 35 cm from the face", "24 mm lens", or "empty top 25 % for a title".
- **References:** say what each one is for ("image 1 is the character, keep it identical; image 2 is the pose only"). Give each generation only the references it needs.
- **For edits, list what stays the same** ("keep the same face, colors, style and background") and repeat it on every iteration to limit drift.
- **Text in images:** keep it short and quoted, and check the spelling yourself. Overlay the text in code for anything important.
- **For vector logos, icons and diagrams,** SVG or code is usually better than a generated image.
- **Transparent background:** pass `--transparent`, then check that the alpha channel really exists.

## Setup

- Install the Codex CLI and run `codex login` with a ChatGPT account. The `image_gen` feature must be on: check with `codex features list | grep image_generation`.
- Optional: `pip install pillow` (for `--crop` and the `SIZE` line).
- Options: `--model <name>` overrides the model in `config.toml`. `--effort` sets the reasoning effort for the wrapper turn and defaults to `low` to keep it fast and cheap. `--timeout` defaults to 600 s.

## Limits and care

- Generation uses the **same Codex usage limits** as coding work on the plan (5-hour and weekly windows). Do not run it in loops or large unattended batches.
- No API key is read or needed, and the script never sets `OPENAI_API_KEY`. Codex runs in a `read-only` sandbox inside a temporary folder, and the prompt forbids shell commands.
- Each run leaves a normal Codex session in `~/.codex/sessions` (that is where the image path and the usage snapshot are read from).
