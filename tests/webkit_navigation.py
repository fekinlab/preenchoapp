"""Controle WebKit: navegações simples, sessão sintética e resposta para download."""
from contextlib import ExitStack
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from pathlib import Path
import sys
from tempfile import TemporaryDirectory

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'lab'))
from mac import start
from playwright.sync_api import sync_playwright


class Fixture(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        if self.path == '/entrar':
            self.send_response(302)
            self.send_header('Location', '/privado')
            self.send_header('Set-Cookie', 'demo=ativo; HttpOnly; SameSite=Lax; Path=/')
            data = b''
        elif self.path == '/privado' and self.headers.get('Cookie') == 'demo=ativo':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            data = b'<h1>Cadastro ficticio</h1><a href="/arquivo">Comparar resposta</a>'
        elif self.path == '/arquivo':
            self.send_response(200)
            self.send_header('Content-Type', 'application/octet-stream')
            self.send_header('Content-Disposition', 'attachment; filename="controle.dev"')
            data = b''
        else:
            self.send_response(403)
            data = b''
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)


with ExitStack() as stack:
    server = stack.enter_context(ThreadingHTTPServer(('127.0.0.1', 0), Fixture))
    Thread(target=server.serve_forever, daemon=True).start()
    stack.callback(server.shutdown)
    origin = f'http://127.0.0.1:{server.server_port}'
    playwright = stack.enter_context(sync_playwright())
    browser = playwright.webkit.launch()
    stack.callback(browser.close)
    page = browser.new_page(**playwright.devices['iPhone 13'])
    assert page.goto(origin + '/privado').status == 403
    response = page.goto(origin + '/entrar')
    assert response.status == 200 and response.request.redirected_from is not None
    assert page.locator('h1').inner_text() == 'Cadastro ficticio'
    with page.expect_download() as event:
        page.get_by_role('link').click()
    assert event.value.suggested_filename == 'controle.dev'
    assert event.value.path().stat().st_size == 0
    print('WebKit: acesso negado sem sessão, 302 + cookie + HTML renderizado, anexo vazio baixado.')

    directory = Path(stack.enter_context(TemporaryDirectory()))
    vault, target = start(stack, directory, 'safari-web-extension://unpaired')
    for url, selector in ((vault, '#vault-gate'), (target, 'input[name="cpf_cliente"]')):
        for path in ('/', '/index.html'):
            response = page.goto(url + path)
            assert response.status == 200
            assert response.headers['content-type'].split(';')[0] == 'text/html'
            assert 'content-disposition' not in response.headers
            assert page.locator(selector).is_visible()
    print('WebKit: cofre e cadastro reais renderizados em ambas as rotas no loopback.')
