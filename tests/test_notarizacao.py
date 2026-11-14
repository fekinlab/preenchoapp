"""Controles de falha do orquestrador. Ferramentas Apple simuladas, sem ticket real."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class Notarization(unittest.TestCase):
    def test_rejection_prevents_distribution(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            app = root / 'Teste.app'
            (app / 'Contents/PlugIns/Demo.appex').mkdir(parents=True)
            scripts = {
                'ditto': 'if [ "$1" = "-c" ]; then touch "$5"; else cp -R "$1" "$2"; fi',
                'codesign': '''if [ "$1" = "-d" ]; then
echo '<plist version="1.0"><dict><key>com.apple.security.app-sandbox</key><true/></dict></plist>'
fi''',
                'xcrun': '''if [ "$1" = notarytool ]; then
echo '{"id":"simulado","status":"Invalid"}'
else touch "$CHECK/stapler-invocado"; fi''',
            }
            for name, script in scripts.items():
                path = root / name
                path.write_text('#!/bin/sh\n' + script + '\n')
                path.chmod(0o700)
            env = dict(os.environ, PATH=str(root) + os.pathsep + os.environ['PATH'],
                       DEVELOPER_ID='Developer ID Application: Simulado', NOTARY_PROFILE='simulado', CHECK=directory)
            result = subprocess.run(['bash', ROOT/'monterey/notarizar.sh', app], cwd=root,
                                    env=env, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('Invalid', result.stdout)
            self.assertFalse((root / 'stapler-invocado').exists())
            self.assertFalse((root / 'Preencho-Monterey-Notarizado.zip').exists())
