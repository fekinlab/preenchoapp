import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from contextlib import redirect_stdout
from io import StringIO

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'lab'))
import diagnostico as diag


class Forwarding(unittest.TestCase):
    def test_html_response_contract(self):
        self.assertTrue(diag.valid((200, 'text/html', '', b'vault-gate'), 'text/html', b'vault-gate'))
        for response in [(404, '', '', b''), (200, 'text/html', '', b'login'),
                         (200, 'text/html', 'attachment', b'vault-gate'),
                         (200, 'application/octet-stream', '', b'vault-gate')]:
            self.assertFalse(diag.valid(response, 'text/html', b'vault-gate'))

    def test_redirect_not_followed_or_logged(self):
        conn = Mock()
        response = conn.getresponse.return_value
        response.status = 302
        response.headers = {'Location': 'https://example.invalid/?private=fixture'}
        response.read.return_value = b''
        with redirect_stdout(StringIO()) as log:
            result = diag.probe(conn, '/', 'test-secret')
        self.assertEqual(result[0], 302)
        conn.request.assert_called_once_with('GET', '/', headers={'X-Github-Token': 'test-secret'})
        conn.close.assert_called_once()
        self.assertNotIn('fixture', log.getvalue())
        self.assertNotIn('test-secret', log.getvalue())

    def test_other_codespace_refused_before_network(self):
        with patch.dict(diag.os.environ, {'CODESPACE_NAME': 'other'}), self.assertRaises(SystemExit):
            diag.main()
