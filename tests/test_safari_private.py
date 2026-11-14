import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from urllib.request import urlopen
from urllib.error import HTTPError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'lab'))
from diagnostico import redirect_kind
from qa_tailnet import private_origins


class PrivateAlternative(unittest.TestCase):
    def test_dns(self):
        for invalid in ('localhost', 'qa.example.com', 'a.b.ts.net.test', 'a.b.ts.net:443', 'a.b.ts.net/path'):
            with self.assertRaises(ValueError):
                private_origins(invalid)

    def test_redacted_location(self):
        for location, expected in [('/login?code=fake', 'mesma origem (relativo)'),
                                   ('https://github.com/login?state=fake', 'github.com'),
                                   ('https://edge.github.dev/path', 'outro host github.dev'),
                                   ('https://example.invalid', 'outro'), ('', 'ausente')]:
            self.assertEqual(redirect_kind(location, 'peer.test'), expected)

    def test_loopback_pair(self):
        with tempfile.TemporaryDirectory() as tmp:
            cmd = [sys.executable, 'lab/qa_tailnet.py', 'qa.test.ts.net', tmp]
            with subprocess.Popen(cmd, cwd=ROOT, stdout=subprocess.PIPE, text=True) as proc:
                try:
                    self.assertIn('https://qa.test.ts.net:8443', proc.stdout.readline())
                    for port, marker in ((8173, b'vault-gate'), (8174, b'cpf_cliente')):
                        with urlopen(f'http://127.0.0.1:{port}/', timeout=3) as r:
                            self.assertEqual(r.headers.get_content_type(), 'text/html')
                            self.assertIn(marker, r.read())
                    with self.assertRaises(HTTPError) as ctx:
                        urlopen('http://127.0.0.1:8174/approval-config.js', timeout=3)
                    self.assertEqual(ctx.exception.code, 404)
                    cfg = (Path(tmp) / 'extension/lab-config.js').read_text()
                    for url in private_origins('qa.test.ts.net'):
                        self.assertIn('"'+url+'"', cfg)
                finally:
                    proc.terminate()
