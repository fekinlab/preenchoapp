"""Run the actual two-port launcher against a disposable synthetic site."""
import os
from pathlib import Path
import signal
import subprocess
import unittest
from urllib.request import urlopen
from urllib.error import HTTPError

class Startup(unittest.TestCase):
    def test_start_repeat_isolation(self):
        root=Path(__file__).resolve().parents[1]
        env=dict(os.environ,CODESPACE_NAME='studious-spork-9q6rg6v7x973pp96')
        env.pop('GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN',None)
        # Keep the child server in a test-owned process group for cleanup.
        proc=subprocess.Popen(['sh','lab/start_qa.sh'],env=env,cwd=root,start_new_session=True)
        try:
            self.assertEqual(proc.wait(timeout=10),0)
            subprocess.run(['sh','lab/start_qa.sh'],env=env,cwd=root,check=True)
            for port,role in [(8173,'vault'),(8174,'target')]:
                with urlopen(f'http://127.0.0.1:{port}/qa-health.txt',timeout=3) as response:
                    self.assertEqual(response.read().decode().strip(),f'preencho-{role}-v2')
            with urlopen('http://127.0.0.1:8173/') as response:
                self.assertIn(b'vault-gate',response.read())
            with self.assertRaises(HTTPError) as error:
                urlopen('http://127.0.0.1:8174/approval-config.js')
            self.assertEqual(error.exception.code,404)
        finally:
            try: os.killpg(proc.pid,signal.SIGTERM)
            except ProcessLookupError: pass
