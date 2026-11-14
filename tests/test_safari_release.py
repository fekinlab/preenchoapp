from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'lab'))
from parear_safari import pair
from safari_build import configure


class Release(unittest.TestCase):
    def test_peer_and_pair(self):
        peer = 'preencho.test.ts.net'
        identity = 'safari-web-extension://abcd-1234'
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            configure(root, peer)
            config = root / 'extension/lab-config.js'
            original = config.read_bytes()
            pair(root, peer, identity)
            pair(root, peer, identity)
            self.assertIn(identity, (root / 'vault/approval-config.js').read_text())
            self.assertEqual(config.read_bytes(), original)
            for host, value in [(peer, identity + '/'), (peer, identity + 'x'),
                                ('other.test.ts.net', identity), (peer, 'https://site.test')]:
                with self.assertRaises(ValueError):
                    pair(root, host, value)

    def test_reject_invalid_peer(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError):
                configure(Path(directory), 'https://example.org')
