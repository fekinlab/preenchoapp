from contextlib import ExitStack
from http.client import HTTPConnection
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'lab'))
from safari_build import configure


class Integrated(unittest.TestCase):
    def test_local_pair_and_host(self):
        with ExitStack() as stack:
            temp = Path(stack.enter_context(tempfile.TemporaryDirectory()))
            sites = temp / 'sites'
            self.assertEqual(configure(sites), ('http://localhost:8173', 'http://localhost:8174'))
            identity = temp / 'identity'
            server = stack.enter_context(subprocess.Popen(
                ['perl', str(ROOT / 'monterey/server.pl'), str(sites/'vault'), str(sites/'target'), str(identity)],
                stdout=subprocess.PIPE))
            stack.callback(server.terminate)
            self.assertEqual(server.stdout.readline(), b'READY\n')

            def get(port, path, host=None):
                conn = HTTPConnection('127.0.0.1', port, timeout=3)
                try:
                    conn.request('GET', path, headers={'Host':host or f'localhost:{port}'})
                    reply = conn.getresponse()
                    return reply.status, reply.read()
                finally:
                    conn.close()

            self.assertIn(b'unpaired', get(8173, '/approval-config.js')[1])
            identity.write_text('https://invalid.example')
            self.assertIn(b'unpaired', get(8173, '/approval-config.js')[1])
            identity.write_text('safari-web-extension://demo-123')
            self.assertIn(b'safari-web-extension://demo-123', get(8173, '/approval-config.js')[1])
            self.assertIn(b'vault-gate', get(8173, '/')[1])
            self.assertIn(b'cpf_cliente', get(8174, '/')[1])
            self.assertEqual(get(8174, '/approval-config.js')[0], 404)
            self.assertEqual(get(8173, '/', 'example.invalid')[0], 404)
