"""Helpers for Codex Image: framing, validation, presets and quota snapshots.

Pillow is required for image validation so a failed image never looks successful.
"""
import json
import math
import time
from pathlib import Path


def load_preset(name, path):
    """Return a checked preset or raise ValueError with a user-facing message."""
    try:
        presets = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise ValueError(f"Cannot load presets from {path}: {exc}") from exc
    if not isinstance(presets, dict) or not isinstance(presets.get("presets"), dict):
        raise ValueError("presets.json must contain a 'presets' object")
    choices = presets["presets"]
    if name not in choices:
        raise ValueError(f"Unknown preset '{name}'. Available: {', '.join(sorted(choices))}")
    preset = choices[name]
    if not isinstance(preset, dict) or not isinstance(preset.get("brief"), str):
        raise ValueError(f"Preset '{name}' must have a 'brief' string")
    aspect = preset.get("aspect")
    if aspect is not None and aspect not in ("1:1", "2:3", "3:4", "4:5", "9:16", "3:2", "4:3", "5:4", "16:9"):
        raise ValueError(f"Preset '{name}' has an unsupported aspect: {aspect}")
    return preset


def quota_window_expired(window, now=None):
    """An old reset timestamp is not evidence that a current window is exhausted."""
    if now is None:
        now = time.time()
    reset = window.get("resets_at")
    return bool(reset is not None and float(reset) <= now)


def quota_exhausted(rate_limits, now=None):
    """Only block on an unexpired, explicitly exhausted usage window.

    The 'rate_limit_reached_type' flag alone can come from an old session.
    """
    if now is None:
        now = time.time()
    for key in ("primary", "secondary"):
        window = (rate_limits or {}).get(key) or {}
        try:
            reset = float(window.get("resets_at") or 0)
            used = float(window.get("used_percent") or 0)
        except (TypeError, ValueError):
            continue
        if reset > now and used >= 100:
            return True
    return False


def _require_pillow():
    try:
        from PIL import Image, ImageColor, ImageFilter
    except ImportError as exc:
        raise ValueError("Pillow is required for safe image validation and framing: pip install pillow") from exc
    return Image, ImageColor, ImageFilter


def validate_png(path, aspect=None, transparent=False):
    """Check actual PNG decode, dimensions, ratio and real alpha transparency."""
    Image, _, _ = _require_pillow()
    p = Path(path)
    try:
        with Image.open(p) as im:
            if im.format != "PNG":
                raise ValueError("Generated file is not a PNG")
            im.verify()
        with Image.open(p) as im:
            im.load()
            w, h = im.size
            if w < 1 or h < 1:
                raise ValueError("Generated image has invalid dimensions")
            if aspect:
                a, b = map(float, aspect.split(":"))
                if abs(w / h - a / b) > max(1.0 / h, 0.001):
                    raise ValueError(f"Aspect mismatch: expected {aspect}, got {w}x{h}")
            if transparent:
                if im.mode not in ("RGBA", "LA") and "transparency" not in im.info:
                    raise ValueError("Transparent background requested, but PNG has no alpha channel")
                rgba = im.convert("RGBA")
                if rgba.getchannel("A").getextrema()[0] == 255:
                    raise ValueError("Transparent background requested, but every pixel is opaque")
            return w, h
    except (OSError, SyntaxError) as exc:
        raise ValueError(f"Invalid or corrupted PNG: {exc}") from exc


def frame_image(path, aspect, mode, focal_x=0.5, focal_y=0.5, transparent=False, pad_color="#FFFFFF"):
    """Crop around a focal point, or fit in a solid/blurred canvas without cutting content.

    Contain and blur are not AI outpainting; the full original remains intact.
    """
    Image, ImageColor, ImageFilter = _require_pillow()
    if mode not in ("crop", "contain", "blur"):
        raise ValueError(f"Unsupported framing mode: {mode}")
    if not (0 <= focal_x <= 1 and 0 <= focal_y <= 1):
        raise ValueError("Focal coordinates must be between 0 and 1")
    a, b = map(int, aspect.split(":"))
    target = a / b
    path = Path(path)
    with Image.open(path) as source:
        im = source.convert("RGBA")
        w, h = im.size
        if math.isclose(w / h, target, abs_tol=0.0005):
            return
        if mode == "crop":
            if w / h > target:
                nw = max(1, round(h * target))
                left = round((w - nw) * focal_x)
                result = im.crop((left, 0, left + nw, h))
            else:
                nh = max(1, round(w / target))
                top = round((h - nh) * focal_y)
                result = im.crop((0, top, w, top + nh))
        else:
            new_w = max(w, math.ceil(h * target))
            new_h = max(h, math.ceil(w / target))
            if transparent:
                fill = (0, 0, 0, 0)
            else:
                try:
                    fill = ImageColor.getcolor(pad_color, "RGBA")
                except ValueError as exc:
                    raise ValueError(f"Invalid pad color: {pad_color}") from exc
            if mode == "blur":
                background = im.resize((new_w, new_h), Image.Resampling.LANCZOS).filter(
                    ImageFilter.GaussianBlur(radius=max(8, min(new_w, new_h) // 30))
                )
                if not transparent:
                    background = background.convert("RGB").convert("RGBA")
            else:
                background = Image.new("RGBA", (new_w, new_h), fill)
            background.alpha_composite(im, ((new_w - w) // 2, (new_h - h) // 2))
            result = background
        result.save(path, format="PNG")
