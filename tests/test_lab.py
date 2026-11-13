import sys
import tempfile
import unittest
import urllib.error
import urllib.request
from contextlib import ExitStack
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'lab'))
from mac import start, chrome_origin


class LocalIntegration(unittest.TestCase):
    def setUp(self):
        self.stack = ExitStack()
        self.addCleanup(self.stack.close)
        self.out = Path(self.stack.enter_context(tempfile.TemporaryDirectory()))
        self.vault,self.target = start(self.stack,self.out,chrome_origin())

    def test_distinct_servers_and_pairing(self):
        self.assertNotEqual(self.vault,self.target)
        with urllib.request.urlopen(self.vault+'/approval-config.js') as r:
            config=r.read().decode()
        for value in (self.vault,self.target,chrome_origin()):
            self.assertIn(value,config)
        self.assertRegex(chrome_origin(),r'^chrome-extension://[a-p]{32}$')

    def test_visual_guide_opens_correct_origins(self):
        with urllib.request.urlopen(self.target+'/guia.html') as r:
            guide=r.read().decode()
        for origin in (self.vault,self.target):
            self.assertIn('href="'+origin+'"',guide)
        self.assertNotIn('__TARGET__',guide)

    def test_destination_cannot_serve_vault(self):
        with self.assertRaises(urllib.error.HTTPError) as failure:
            urllib.request.urlopen(self.target+'/approval-config.js')
        self.assertEqual(failure.exception.code,404)

    def test_rebinding_and_writes_rejected(self):
        for request,code in [
            (urllib.request.Request(self.vault,headers={'Host':'example.invalid'}),403),
            (urllib.request.Request(self.vault,data=b'demo'),501),
        ]:
            with self.assertRaises(urllib.error.HTTPError) as failure:
                urllib.request.urlopen(request)
            self.assertEqual(failure.exception.code,code)

    def test_no_cache_or_embedding(self):
        with urllib.request.urlopen(self.vault) as r:
            self.assertEqual(r.headers['Cache-Control'],'no-store')
            self.assertEqual(r.headers['X-Frame-Options'],'DENY')
