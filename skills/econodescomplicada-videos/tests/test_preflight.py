"""Offline tests for environment discovery, with no external tools required."""
import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import preflight


class ConfigTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve()
        self.path = self.root / "config.local.json"
        self.data = {
            "paths": {"workspace": "./episodes", "engine": "./engine", "sprites": "assets/sprites"},
            "production": {"render_workers": 2, "image_backend": "codex-image"},
            "archive": {"mode": "local"}
        }
        self.write()

    def write(self):
        self.path.write_text(json.dumps(self.data), encoding="utf-8")

    def test_relative_paths_resolve_from_config_directory(self):
        cfg = preflight.load_config(self.path, environ={})
        self.assertEqual(cfg["paths"]["workspace"], self.root / "episodes")
        self.assertEqual(cfg["paths"]["engine"], self.root / "engine")
        self.assertEqual(cfg["paths"]["sprites"], self.root / "assets/sprites")

    def test_env_override_takes_precedence(self):
        custom = self.root / "somewhere"
        cfg = preflight.load_config(
            self.path, environ={"ECONO_WORKSPACE": str(custom), "ECONO_RENDER_WORKERS": "3"}
        )
        self.assertEqual(cfg["paths"]["workspace"], custom)
        self.assertEqual(cfg["production"]["render_workers"], 3)

    def test_default_worker_bounds(self):
        self.data["production"]["render_workers"] = "auto"
        self.write()
        with patch("preflight.os.cpu_count", return_value=1):
            self.assertEqual(preflight.load_config(self.path, environ={})["production"]["render_workers"], 1)
        with patch("preflight.os.cpu_count", return_value=64):
            self.assertEqual(preflight.load_config(self.path, environ={})["production"]["render_workers"], 4)

    def test_reject_bad_worker_count(self):
        self.data["production"]["render_workers"] = 0
        self.write()
        with self.assertRaisesRegex(ValueError, "between 1 and 32"):
            preflight.load_config(self.path, environ={})

    def test_reject_bad_backend(self):
        self.data["production"]["image_backend"] = "made-up"
        self.write()
        with self.assertRaisesRegex(ValueError, "image_backend"):
            preflight.load_config(self.path, environ={})

    def test_bad_config_is_explicit_error(self):
        self.path.write_text("not json", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Cannot read config"):
            preflight.load_config(self.path, environ={})

    def test_plan_needs_no_external_runtime(self):
        cfg = preflight.load_config(self.path, environ={})
        report = preflight.inspect(cfg, "plan")
        self.assertTrue(report["ready"])
        self.assertEqual(len(report["checks"]), 1)
        self.assertFalse((self.root / "episodes").exists())

    def test_empty_workspace_blocks_plan(self):
        self.data["paths"]["workspace"] = ""
        self.write()
        cfg = preflight.load_config(self.path, environ={})
        report = preflight.inspect(cfg, "plan")
        self.assertFalse(report["ready"])
        self.assertTrue(any("workspace" in e for e in report["errors"]))

    def test_render_missing_resources_fails_and_does_not_create(self):
        cfg = preflight.load_config(self.path, environ={})
        report = preflight.inspect(cfg, "render")
        self.assertFalse(report["ready"])
        self.assertTrue(any("renderer" in e for e in report["errors"]))
        self.assertFalse((self.root / "engine").exists())

    def test_publish_checks_checker_and_drive_folder(self):
        self.data["archive"] = {"mode": "google-drive", "drive_folder_id": ""}
        self.write()
        cfg = preflight.load_config(self.path, environ={})
        report = preflight.inspect(cfg, "publish")
        self.assertFalse(report["ready"])
        self.assertTrue(any("checker_script" in e for e in report["errors"]))
        self.assertTrue(any("drive_folder" in e for e in report["errors"]))

    def test_external_providers_are_marked_unverified(self):
        self.data["production"].update(image_backend="external", tts_backend="external")
        self.write()
        cfg = preflight.load_config(self.path, environ={})
        report = preflight.inspect(cfg, "render")
        self.assertTrue(any("image:external" in w for w in report["manual_verification"]))
        self.assertTrue(any("tts:external" in w for w in report["manual_verification"]))
        self.assertFalse(report["ready"])

    def create_render_assets(self):
        engine = self.root / "engine"
        sprites = self.root / "assets" / "sprites"
        engine.mkdir(exist_ok=True)
        sprites.mkdir(parents=True, exist_ok=True)
        for name in preflight.REQUIRED_SPRITES:
            (sprites / name).write_bytes(b"placeholder")
        (engine / "render_paralelo.mjs").write_text("", encoding="utf-8")
        return engine, sprites

    def test_optional_episode_template_can_be_absent(self):
        self.create_render_assets()
        self.data["paths"].pop("episode_template", None)
        self.write()
        cfg = preflight.load_config(self.path, environ={})
        with patch("preflight.shutil.which", return_value="/test/executable"), \
                patch("preflight.find_browser", return_value="/test/browser"), \
                patch("preflight.importlib.util.find_spec", return_value=object()):
            report = preflight.inspect(cfg, "render")
        self.assertTrue(report["ready"])
        self.assertEqual(report["status"], "ready")
        self.assertFalse(any("episode_template" in err for err in report["errors"]))

    def test_bad_optional_template_is_warning_when_engine_complete(self):
        self.create_render_assets()
        self.data["paths"]["episode_template"] = "./missing-template"
        self.write()
        cfg = preflight.load_config(self.path, environ={})
        with patch("preflight.shutil.which", return_value="/test/executable"), \
                patch("preflight.find_browser", return_value="/test/browser"), \
                patch("preflight.importlib.util.find_spec", return_value=object()):
            report = preflight.inspect(cfg, "render")
        self.assertTrue(report["ready"])
        self.assertTrue(any("episode_template" in warning for warning in report["warnings"]))

    def test_external_providers_require_verification_even_if_all_tools_exist(self):
        self.create_render_assets()
        self.data["production"].update(image_backend="external", tts_backend="external")
        self.write()
        cfg = preflight.load_config(self.path, environ={})
        with patch("preflight.shutil.which", return_value="/test/executable"), \
                patch("preflight.find_browser", return_value="/test/browser"):
            report = preflight.inspect(cfg, "render")
        self.assertFalse(report["ready"])
        self.assertEqual(report["status"], "needs_verification")
        self.assertFalse(report["errors"])
        self.assertEqual(len(report["manual_verification"]), 2)
        self.assertTrue(any("image:external" in item for item in report["manual_verification"]))
        self.assertTrue(any("tts:external" in item for item in report["manual_verification"]))

    def test_publish_requires_drive_connection_verification(self):
        self.create_render_assets()
        checker = self.root / "check.py"
        checker.write_text("# test", encoding="utf-8")
        self.data["paths"]["checker_script"] = "./check.py"
        self.data["archive"] = {"mode": "google-drive", "drive_folder_id": "test-only-id"}
        self.write()
        cfg = preflight.load_config(self.path, environ={})
        with patch("preflight.shutil.which", return_value="/test/executable"), \
                patch("preflight.find_browser", return_value="/test/browser"), \
                patch("preflight.importlib.util.find_spec", return_value=object()):
            report = preflight.inspect(cfg, "publish")
        self.assertEqual(report["status"], "needs_verification")
        self.assertFalse(report["ready"])
        self.assertTrue(any("drive_connector" in item for item in report["manual_verification"]))

    def test_unverified_external_provider_is_not_reported_ready_by_cli(self):
        self.create_render_assets()
        self.data["production"].update(image_backend="external", tts_backend="external")
        self.write()
        buf = io.StringIO()
        with patch("preflight.shutil.which", return_value="/test/executable"), \
                patch("preflight.find_browser", return_value="/test/browser"), \
                contextlib.redirect_stdout(buf):
            rc = preflight.main(["--config", str(self.path), "--stage", "render", "--json"])
        obj = json.loads(buf.getvalue())
        self.assertEqual(rc, 2)
        self.assertEqual(obj["status"], "needs_verification")
        self.assertFalse(obj["ready"])

    def test_render_can_pass_with_injected_tools_and_assets(self):
        engine = self.root / "engine"
        sprites = self.root / "assets" / "sprites"
        template = self.root / "template"
        engine.mkdir()
        sprites.mkdir(parents=True)
        template.mkdir()
        for name in preflight.REQUIRED_SPRITES:
            (sprites / name).write_bytes(b"placeholder")  # presence only, not content validation
        (engine / "render_paralelo.mjs").write_text("", encoding="utf-8")
        self.data["paths"]["episode_template"] = "./template"
        self.write()
        cfg = preflight.load_config(self.path, environ={})
        with patch("preflight.shutil.which", return_value="/test/executable"), \
                patch("preflight.find_browser", return_value="/test/browser"), \
                patch("preflight.importlib.util.find_spec", return_value=object()):
            report = preflight.inspect(cfg, "render")
        self.assertTrue(report["ready"])
        self.assertFalse(report["errors"])

    def test_main_json_exit_without_side_effect(self):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            code = preflight.main(["--config", str(self.path), "--stage", "plan", "--json"])
        result = json.loads(buf.getvalue())
        self.assertEqual(code, 0)
        self.assertTrue(result["ready"])
        self.assertEqual(result["host"]["os"], preflight.platform.system())


if __name__ == "__main__":
    unittest.main()
