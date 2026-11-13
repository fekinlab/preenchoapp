"""Launch the Mac QA lab. Only Python standard library is required."""
import argparse
import base64
import hashlib
import json
import re
import subprocess
import sys
import tempfile
import threading
import webbrowser
from contextlib import ExitStack
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from prepare import ROOT, prepare


def chrome_origin():
    key = json.loads((ROOT/'extension/manifest.json').read_text())['key']
    digest = hashlib.sha256(base64.b64decode(key, validate=True)).hexdigest()[:32]
    return 'chrome-extension://' + digest.translate(str.maketrans('0123456789abcdef','abcdefghijklmnop'))


class Files(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def list_directory(self, path):
        self.send_error(404)

    def do_GET(self):
        if self.headers.get('Host') != self.server.expected_host:
            self.send_error(403)
            return
        super().do_GET()

    def do_HEAD(self):
        if self.headers.get('Host') != self.server.expected_host:
            self.send_error(403)
            return
        super().do_HEAD()

    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Frame-Options','DENY')
        self.send_header('X-Content-Type-Options','nosniff')
        super().end_headers()


def server(stack, directory):
    # Reserve both listeners before rendering the configuration; no port race.
    http = stack.enter_context(ThreadingHTTPServer(('127.0.0.1',0),partial(Files,directory=str(directory))))
    http.expected_host = 'localhost:' + str(http.server_port)
    return http, 'http://' + http.expected_host


def safari_project(extension, output):
    for tool in ('safari-web-extension-packager','safari-web-extension-converter'):
        if subprocess.run(['xcrun','--find',tool],capture_output=True).returncode == 0:
            subprocess.run(['xcrun',tool,str(extension),'--project-location',str(output),
                            '--app-name','Preencho Lab','--bundle-identifier','studio.fekin.preencho.lab',
                            '--no-prompt','--no-open'],check=True)
            return next(output.rglob('*.xcodeproj'))
    raise RuntimeError('Instale e abra o Xcode completo no Mac para preparar o projeto Safari.')


def start(stack, out, identity):
    vault_http, vault = server(stack,out/'vault')
    target_http, target = server(stack,out/'target')
    prepare(out,identity,vault,target)
    guide = (ROOT/'lab/guia.html').read_text().replace('__TARGET__',target).replace('__VAULT__',vault)
    (out/'target/guia.html').write_text(guide)
    for http in (vault_http,target_http):
        threading.Thread(target=http.serve_forever,daemon=True).start()
        stack.callback(http.shutdown)
    return vault,target


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--safari',action='store_true')
    args = parser.parse_args()
    with ExitStack() as stack:
        # A stable extension directory is required for Chrome's unpacked installation.
        # Keep each run separate so two launches never overwrite a live configuration.
        out = Path(tempfile.mkdtemp(prefix='Preencho-Lab-',dir=Path.home()/'Downloads'))
        identity = chrome_origin()
        vault,target = start(stack,out,identity)
        if args.safari:
            project = safari_project(out/'extension',out/'Xcode')
            subprocess.run(['open',str(project)],check=True)
            webbrowser.get('safari').open(target+'/guia.html')
            text = subprocess.run(['osascript','-e',
                'text returned of (display dialog "No Safari, habilite a extensão do Xcode. No cadastro, abra Preenchô → Analisar → Configuração do laboratório. Cole aqui a origem exibida." default answer "" with title "Conectar Safari")'],
                text=True,capture_output=True)
            ident = text.stdout.strip()
            if text.returncode or not re.fullmatch(r'safari-web-extension://[a-zA-Z0-9.-]+',ident):
                raise RuntimeError('Conexão Safari cancelada ou origem inválida.')
            config = out/'vault/approval-config.js'
            replacement = config.with_suffix('.new')
            replacement.write_text('globalThis.approvalConfig = '+ json.dumps(dict(vault=vault,target=target,extension=ident))+';')
            replacement.replace(config)
            webbrowser.get('safari').open(target+'/guia.html')
        else:
            chrome = Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
            if not chrome.is_file():
                raise RuntimeError('Instale Google Chrome em Aplicativos ou use o iniciador Safari.')
            profile = stack.enter_context(tempfile.TemporaryDirectory(prefix='Preencho-Chrome-'))
            process = subprocess.Popen([str(chrome),'--user-data-dir='+profile,'--no-first-run','--no-default-browser-check',
                              'chrome://extensions',target+'/guia.html'])
            stack.callback(process.wait, 15)
            stack.callback(process.terminate)
            subprocess.run(['open','-R',str(out/'extension')],check=True)
        subprocess.run(['osascript','-e',
                'display dialog "Deixe esta janela aberta durante o teste. Ao terminar, feche as abas do laboratório e clique em Encerrar." buttons {"Encerrar"} default button "Encerrar" with title "Preenchô em execução"'],check=False)



if __name__ == '__main__':
    try:
        main()
    except (OSError, RuntimeError, subprocess.SubprocessError) as exc:
        print('Preenchô:',exc,file=sys.stderr)
        if sys.platform == 'darwin':
            subprocess.run(['osascript','-e','on run argv','-e','display alert "Preenchô" message (item 1 of argv)','-e','end run',str(exc)])
        sys.exit(1)
