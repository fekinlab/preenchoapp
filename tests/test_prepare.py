import json
import tempfile
import unittest
from pathlib import Path
from lab.prepare import prepare, ROOT

EXT = 'chrome-extension://' + 'b' * 32


class Packaging(unittest.TestCase):
    def test_isolated_output(self):
        with tempfile.TemporaryDirectory() as temp:
            out = Path(temp)
            prepare(out, EXT)
            self.assertEqual((out/'vault/app.js').read_bytes(), (ROOT/'app.js').read_bytes())
            self.assertIn('approval.js', (out/'vault/index.html').read_text())
            self.assertNotIn('approval.js', (ROOT/'index.html').read_text())
            manifest = json.loads((out/'extension/manifest.json').read_text())
            self.assertEqual(manifest['permissions'], ['activeTab','scripting'])
            self.assertNotIn('host_permissions', manifest)
            self.assertIn(EXT, (out/'vault/approval-config.js').read_text())
            with self.assertRaises(ValueError):
                prepare(out, EXT)

    def test_reject_untrusted_configuration(self):
        with tempfile.TemporaryDirectory() as temp:
            for vault, target, extension in [
                ('http://bad.invalid','https://example.invalid',EXT),
                ('https://a.invalid','https://a.invalid',EXT),
                ('https://fekinlab.github.io','https://b.invalid',EXT),
                ('https://a.invalid','https://b.invalid','*'),
            ]:
                with self.subTest(vault=vault,target=target,extension=extension), self.assertRaises(ValueError):
                    prepare(Path(temp),extension,vault,target)
