"""Offline regression tests: never launch Codex or consume image quota."""
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from image_utils import frame_image, load_preset, quota_exhausted, quota_window_expired, validate_png
from codex_image import build_prompt


class PresetTests(unittest.TestCase):
    def setUp(self):
        self.presets = Path(__file__).resolve().parents[1] / "presets.json"

    def test_preset_selection(self):
        self.assertEqual(load_preset("hero", self.presets)["aspect"], "16:9")
        self.assertIn("negative space", load_preset("hero", self.presets)["brief"])

    def test_unknown_preset_fails(self):
        with self.assertRaisesRegex(ValueError, "Unknown preset"):
            load_preset("does-not-exist", self.presets)

    def test_bad_json_fails(self):
        with tempfile.TemporaryDirectory() as temp:
            p = Path(temp) / "presets.json"
            p.write_text("{nope", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Cannot load presets"):
                load_preset("hero", p)


class QuotaTests(unittest.TestCase):
    def test_expired_full_snapshot_never_blocks(self):
        limits = {"rate_limit_reached_type": "primary", "primary": {"used_percent": 100, "resets_at": 100}}
        self.assertFalse(quota_exhausted(limits, now=101))
        self.assertTrue(quota_window_expired(limits["primary"], now=101))

    def test_active_full_snapshot_blocks(self):
        self.assertTrue(quota_exhausted({"primary": {"used_percent": 100, "resets_at": 200}}, now=101))

    def test_old_limit_flag_without_window_does_not_block(self):
        self.assertFalse(quota_exhausted({"rate_limit_reached_type": "primary"}, now=101))

    def test_secondary_window_is_checked(self):
        limits = {"primary": {"used_percent": 2, "resets_at": 200}, "secondary": {"used_percent": 100, "resets_at": 300}}
        self.assertTrue(quota_exhausted(limits, now=101))


class ImageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.p = Path(self.temp.name) / "test.png"

    def test_validate_png_and_aspect(self):
        Image.new("RGB", (100, 100), "red").save(self.p)
        self.assertEqual(validate_png(self.p, "1:1"), (100, 100))
        with self.assertRaisesRegex(ValueError, "Aspect mismatch"):
            validate_png(self.p, "16:9")

    def test_reject_invalid_png(self):
        self.p.write_bytes(b"not a png")
        with self.assertRaises(ValueError):
            validate_png(self.p)

    def test_reject_fake_transparency(self):
        Image.new("RGBA", (100, 100), (255, 255, 255, 255)).save(self.p)
        with self.assertRaisesRegex(ValueError, "every pixel is opaque"):
            validate_png(self.p, transparent=True)

    def test_transparent_png_is_accepted(self):
        Image.new("RGBA", (100, 100), (255, 255, 255, 0)).save(self.p)
        self.assertEqual(validate_png(self.p, transparent=True), (100, 100))

    def test_crop_focal_point(self):
        im = Image.new("RGB", (160, 100), "red")
        for x in range(80, 160):
            for y in range(100):
                im.putpixel((x, y), (0, 0, 255))
        im.save(self.p)
        frame_image(self.p, "1:1", "crop", focal_x=1)
        self.assertEqual(validate_png(self.p, "1:1"), (100, 100))
        with Image.open(self.p) as im:
            self.assertEqual(im.getpixel((99, 50)), (0, 0, 255, 255))

    def test_contain_preserves_whole_image(self):
        Image.new("RGB", (160, 100), "red").save(self.p)
        frame_image(self.p, "1:1", "contain", pad_color="#ffffff")
        self.assertEqual(validate_png(self.p, "1:1"), (160, 160))
        with Image.open(self.p) as im:
            self.assertEqual(im.getpixel((0, 30)), (255, 0, 0, 255))
            self.assertEqual(im.getpixel((0, 0)), (255, 255, 255, 255))

    def test_blur_preserves_foreground(self):
        Image.new("RGB", (160, 100), "red").save(self.p)
        frame_image(self.p, "1:1", "blur")
        self.assertEqual(validate_png(self.p, "1:1"), (160, 160))

    def test_missing_pillow_fails_clearly(self):
        with patch("image_utils._require_pillow", side_effect=ValueError("Pillow is required")):
            with self.assertRaisesRegex(ValueError, "Pillow"):
                validate_png(self.p)


class PromptTests(unittest.TestCase):
    def make_args(self, **overrides):
        values = dict(prompt="A product illustration", prompt_file=None, aspect="16:9",
                      framing="contain", crop=False, transparent=False, ref=[],
                      preset="hero", preset_config={"brief": "Reserve negative space"},
                      brand_kit_text="Primary ink #051a24")
        values.update(overrides)
        return SimpleNamespace(**values)

    def test_preset_and_brand_kit_reach_codex_prompt(self):
        prompt = build_prompt(self.make_args())
        self.assertIn("VISUAL PRESET hero", prompt)
        self.assertIn("Primary ink #051a24", prompt)
        self.assertIn("Target aspect ratio 16:9", prompt)
        self.assertIn("Keep the whole subject in frame", prompt)

    def test_crop_adds_safe_margin_guidance(self):
        prompt = build_prompt(self.make_args(framing="crop", aspect="9:16"))
        self.assertIn("IMPORTANT FRAMING", prompt)

    def test_brief_does_not_need_preset(self):
        prompt = build_prompt(self.make_args(preset=None, preset_config=None,
                                             brand_kit_text="", framing=None))
        self.assertIn("A product illustration", prompt)
        self.assertNotIn("VISUAL PRESET", prompt)


if __name__ == "__main__":
    unittest.main()
