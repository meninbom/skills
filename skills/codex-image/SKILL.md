---
name: codex-image
description: Generate or edit raster images (illustrations, mascots, banners, product shots, mockups, Reel stills) with the Codex CLI's built-in image tool through the user's ChatGPT login, with no API key and no paid API. Use when the user asks to create, generate, edit or refine an image, or when a project needs a visual asset that code or SVG cannot produce. The agent writes the brief, runs one command, looks at the result and iterates.
---

# Codex Image (built-in Codex image tool, driven by an AI agent)

You do not draw the pixels. You are the **art director**: turn the request into a precise brief, run the script, **look at the image**, and decide whether to redo it.

The script is `scripts/codex_image.py` in this skill's directory (Python 3 and Pillow required for safe PNG validation/framing). It calls `codex exec` once, Codex calls its built-in `image_gen` tool once, and the script copies the PNG from `$CODEX_HOME/generated_images/<thread>/` to the path you choose. **Run it yourself, directly, from the shell.** Do not hand it to a sub-agent. One image takes about 20–40 s.

## Adaptive briefing (before any quota-consuming run)

The goal is to clarify the user's intent with **as little friction as possible**. This is guidance for the conversational agent, not a mandatory CLI questionnaire.

- **Complete brief:** if purpose, style, subject and any important restrictions are already clear, **do not ask questions**. Choose the relevant preset or proceed without one.
- **Partially specified:** ask **one or two** targeted questions only about choices that would materially change the output (e.g. purpose, aesthetic, composition, aspect, brand kit). Offer a reasonable default when the answer is low-stakes.
- **Open-ended:** propose two or three distinct creative directions in a single concise question. Ask only the essential next question, then generate. Do not demand a long form or approval ceremony.
- **Existing project:** inspect its available brand kit, visual assets and earlier user directions first. Never ask again for a color, ratio or reference already supplied.
- **Edits/iterations:** retain agreed style, colors, proportions, references and restrictions from the conversation. Ask again only when the user changes direction or previous context is unavailable. Keep the last consolidated brief in a project-local UTF-8 file if repeatability matters; never store private credentials in a brief.

Build the final English prompt with: **purpose + subject + visual style + framing/negative space + palette/brand + references + short exact text (if unavoidable) + exclusions**. Use the same agreed brief on retries. An agent can ask questions; the Python script cannot and should not.

## Workflow

1. **Understand the request.** Apply the adaptive briefing rules above; ask only when the missing detail actually changes the result. Every image uses the plan's Codex usage limits.
2. **Write the brief in English, with numbers.** Include subject, medium/style, composition, lighting, palette (hex codes if the project has them), and what you do NOT want. Put any text that must appear in quotes and keep it short.
3. **Run the script.** Prefer a suitable visual preset or a project-specific brand kit when available; they are optional, not compulsory.
   ```bash
   python3 "<skill-dir>/scripts/codex_image.py" "<brief>" -o assets/name.png --aspect 9:16 --crop
   python3 "<skill-dir>/scripts/codex_image.py" --prompt-file brief.txt -o assets/name.png --aspect 4:5 --ref ref1.png --ref ref2.png
   ```
   For long or complex briefs, write a text or JSON file and use `--prompt-file`, because quotes break on the command line.
4. **Look at the result yourself.** Open the saved file with a tool that can show images. Judge composition, readable text, artifacts, hands, cropped limbs, and how well it matches the brief. Be honest with the user about what is wrong.
5. **Iterate 2–3 times at most.** Preserve the answers and design decisions from intake; do not restart the questionnaire. For a small fix, pass the previous image with `--ref` and ask only for the change ("Edit image 1. Change only X; keep Y unchanged"). Then show the user and ask.
6. **Save assets inside the project** (`assets/`, `public/`, `docs/`), never loose in the root. The script never overwrites a file: it writes `name-v2.png` unless you pass `--force`. It validates first and only publishes the final PNG on success.

## Presets, brand kits, framing

The presets live in `presets.json`: `hero` (16:9), `mascot` (1:1), `social` (4:5), `reel` (9:16). A preset contributes **composition guidance and default aspect**, not a rigid aesthetic. An explicit `--aspect` takes priority over the preset's ratio.

- Use `--preset hero` for website hero artwork with negative space for live HTML text, or `--preset mascot` for consistent full-character illustrations.
- Use `--brand-kit path/to/brand.md` to pass an existing project's visual guidelines into the Codex image brief. Only pass local material actually available in the project. The project brand kit overrides generic visual preferences when they conflict.
- Use `--framing crop` (or legacy `--crop`) for exact ratio with a crop. `--focal-x` / `--focal-y` from 0 to 1 determine the crop's focal point (default 0.5/center); inspect edges afterward.
- Use `--framing contain` for solid-color padding (with optional `--pad-color '#051a24'`) or `--framing blur` for a blurred-background extension. **Neither is AI outpainting**; both preserve the full original canvas without cutting the subject.
- If no framing is selected, `--aspect` only guides the model, and the actual aspect is reported but not guaranteed. `--framing` requires an aspect, either explicit or from a preset.

Example: `python3 <skill-dir>/scripts/codex_image.py 'Product hero, laptop on the right, empty left half' --preset hero --brand-kit brand.md --framing contain -o public/hero.png`.

## Reading the script output

| Line | Meaning | What to do |
|---|---|---|
| `SAVED <path>` | image saved | open it and look |
| `SIZE <w>x<h>` | pixel size of the saved file | check it fits the use |
| `VALIDATED PNG <w>x<h>` | PNG decoded, framing ratio verified if requested, and transparency checked when requested | safe to inspect the artifact |
| `SOURCE <path>` / `UNCROPPED <path>` | original under `$CODEX_HOME/generated_images` (full canvas before `--crop`) | use as `--ref` for the next edit |
| `QUOTA <text>` | a usage window crossed 50/25/10/5 % left | **tell the user in one short sentence**, then continue |
| `LIMIT_REACHED <text>` | the Codex usage limit is over (exit 4) | stop, tell the user when it resets, do not retry |

Exit codes: `0` ok; `1` no image, image QA failed, or refused (read the message); `2` not logged in (`codex login`), Pillow missing, or a bad command line; `3` codex CLI missing; `4` usage limit reached; `5` timeout. On `2`, `3` or `4`, take the problem to the user instead of retrying.

Before a batch of more than about 6 images, run `python3 <skill-dir>/scripts/codex_image.py --quota` and tell the user how much is left. It generates nothing. It prints the most recent usage snapshot Codex received from the server (5-hour window, weekly window and plan), so it is only as fresh as the last Codex run.

## Sizes and aspect

The built-in tool has no size parameter: it picks the canvas from the prompt. The script asks for the exact ratio and names a fallback canvas. Observed outputs (2026-11-20): 1024×1024, 1024×1536 / 1536×1024, and sometimes native 16:9 / 9:16 at 1672×941 / 941×1672.

- `--aspect` adds the ratio hint (`1:1`, portrait `2:3 3:4 4:5 9:16`, landscape `3:2 4:3 5:4 16:9`).
- `--crop` is the backwards-compatible alias for `--framing crop`; the default is a center crop, but `--focal-x` and `--focal-y` permit other crop positions (2:3 → 9:16 may give 864×1536). The prompt asks the model to keep a safe margin around the subject.
- `--framing contain` and `--framing blur` extend the canvas without cutting the content. This is deterministic padding, not generative outpainting.
- For 1080×1920 Reels, upscale afterwards (ffmpeg, Real-ESRGAN, etc.). The model does not output 1080p natively.

## Brief lessons

- **Numbers beat adjectives.** "Close-up" is vague. Say "the body fills about 45 % of the frame height", "camera about 35 cm from the face", "24 mm lens", or "empty top 25 % for a title".
- **References:** say what each one is for ("image 1 is the character, keep it identical; image 2 is the pose only"). Give each generation only the references it needs.
- **For edits, list what stays the same** ("keep the same face, colors, style and background") and repeat it on every iteration to limit drift.
- **Text in images:** keep it short and quoted, and check the spelling yourself. Overlay the text in code for anything important.
- **For vector logos, icons and diagrams,** SVG or code is usually better than a generated image.
- **Transparent background:** pass `--transparent`. The script now rejects the generated PNG if it is fully opaque or lacks real alpha, instead of silently claiming transparency.

## Setup

- Install the Codex CLI and run `codex login` with a ChatGPT account. The `image_gen` feature must be on: check with `codex features list | grep image_generation`.
- Required: `pip install pillow` (for PNG integrity QA, real-alpha check, and safe framing). A missing Pillow installation now stops before a quota-consuming generation.
- Options: `--model <name>` overrides the model in `config.toml`. `--effort` sets the reasoning effort for the wrapper turn and defaults to `low` to keep it fast and cheap. `--timeout` defaults to 600 s.

## Limits and care

- Generation uses the **same Codex usage limits** as coding work on the plan (5-hour and weekly windows). Do not run it in loops or large unattended batches.
- No API key is read or needed, and the script never sets `OPENAI_API_KEY`. Codex runs in a `read-only` sandbox inside a temporary folder, and the prompt forbids shell commands.
- Unit tests run offline with `python3 -m unittest discover -s <skill-dir>/tests -v`; CI does not call Codex or spend generation quota.
- Usage snapshots may be stale; an expired reset timestamp never blocks a new run based only on old local session logs.
- Each run leaves a normal Codex session in `~/.codex/sessions` (that is where the image path and the usage snapshot are read from).
