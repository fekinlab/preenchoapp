import sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'lab'))
from codespaces_qa import origins,package

class PrivateLab(unittest.TestCase):
    def test_build_with_two_hosts(self):
        hosts=origins('test-abc','app.github.dev')
        with tempfile.TemporaryDirectory() as out:
            root=Path(out)
            package(root,*hosts,'safari-web-extension://unpaired')
            cfg=(root/'extension/lab-config.js').read_text()
            for host in hosts:self.assertIn(host,cfg)
            self.assertNotIn('app.js',[p.name for p in (root/'target').iterdir()])
            self.assertIn('unpaired',(root/'vault/approval-config.js').read_text())
    def test_invalid_domain(self):
        with self.assertRaises(ValueError):origins('test-abc','example.invalid')
