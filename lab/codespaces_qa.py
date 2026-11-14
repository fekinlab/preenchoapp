"""Two private Codespaces forwarded ports, distinct HTTPS origins, no user records."""
import os
import re
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
from contextlib import ExitStack
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from safari_https import package

class Static(SimpleHTTPRequestHandler):
    def log_message(self,*args):
        pass
    def list_directory(self,path):
        self.send_error(404)
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Frame-Options','DENY')
        self.send_header('X-Content-Type-Options','nosniff')
        super().end_headers()

def origins(name,domain):
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',name) or domain != 'app.github.dev':
        raise ValueError('Endereço inesperado do Codespaces')
    return tuple(f'https://{name}-{port}.{domain}' for port in (8173,8174))

def main():
    vault,target=origins(os.environ['CODESPACE_NAME'],os.environ['GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN'])
    with ExitStack() as stack:
        root=Path(stack.enter_context(TemporaryDirectory()))
        package(root,vault,target,os.environ.get('PREENCHO_SAFARI_ORIGIN','safari-web-extension://unpaired'))
        servers=[stack.enter_context(ThreadingHTTPServer(('127.0.0.1',port),partial(Static,directory=str(root/site))))
                 for port,site in [(8173,'vault'),(8174,'target')]]
        print(vault,target,flush=True)
        Thread(target=servers[0].serve_forever,daemon=True).start()
        servers[1].serve_forever()

if __name__=='__main__':
    main()
