"""Diagnóstico de leitura para as duas portas do Codespace studious spork."""
from http.client import HTTPConnection, HTTPSConnection, HTTPException
import os
from pathlib import Path
import subprocess
import sys
from urllib.parse import urlsplit

from codespaces_qa import origins

NAME = 'studious-spork-9q6rg6v7x973pp96'
LIMIT = 2 * 1024 * 1024


def redirect_kind(location, host):
    if not location:
        return 'ausente'
    try:
        dest = urlsplit(location)
        if not dest.netloc and not dest.scheme:
            return 'mesma origem (relativo)'
        if dest.scheme == 'https' and dest.hostname == host and dest.port in (None, 443):
            return 'mesma origem'
        if dest.scheme == 'https' and dest.hostname == 'github.com':
            return 'github.com'
        if dest.scheme == 'https' and (dest.hostname or '').endswith('.github.dev'):
            return 'outro host github.dev'
    except ValueError:
        pass
    return 'outro'


def probe(connection, path, token=None):
    try:
        # http.client nunca segue redirecionamentos. Nenhum cookie é persistido.
        connection.request('GET', path, headers={'X-Github-Token': token} if token else {})
        response = connection.getresponse()
        body = response.read(LIMIT + 1)
        mime = response.headers.get('Content-Type', '').partition(';')[0].lower().strip()
        disposition = response.headers.get('Content-Disposition', '').partition(';')[0].lower().strip()
        print(f'HTTP {response.status}, tipo={mime if mime in ("text/html", "text/plain", "application/octet-stream") else ("outro" if mime else "ausente")}, '
              f'disposição={disposition if disposition in ("inline", "attachment") else ("outra" if disposition else "ausente")}, bytes={len(body)}, '
              f'redireciona={redirect_kind(response.headers.get("Location"), connection.host)}, '
              f'define-cookie={"sim" if "Set-Cookie" in response.headers else "não"}')
        return response.status, mime, disposition, body
    finally:
        connection.close()


def valid(result, mime, marker):
    status, actual, disposition, body = result
    return status == 200 and actual == mime and disposition in ('', 'inline') and len(body) <= LIMIT and marker in body


def main():
    if os.environ.get('CODESPACE_NAME') != NAME:
        sys.exit('Abra o Codespace existente studious spork.')
    hosts = origins(NAME, os.environ.get('GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN', 'app.github.dev'))
    token = os.environ.get('GITHUB_TOKEN')
    if not token:
        sys.exit('Sessão do Codespace sem autenticação para a comparação HTTPS.')
    subprocess.run(['sh', 'lab/start_qa.sh'], cwd=Path(__file__).resolve().parents[1], check=True)
    ok = True
    for port, origin, role, marker in zip((8173, 8174), hosts, ('vault', 'target'), (b'vault-gate', b'cpf_cliente')):
        host = origin.removeprefix('https://')
        for path in ('/', '/index.html', '/qa-health.txt'):
            mime, expected = ('text/plain', f'preencho-{role}-v2'.encode()) if path.endswith('.txt') else ('text/html', marker)
            print(port, path, 'local', flush=True)
            local = probe(HTTPConnection('127.0.0.1', port, timeout=8), path)
            print(port, path, 'HTTPS autenticado', flush=True)
            remote = probe(HTTPSConnection(host, timeout=10), path, token)
            ok &= valid(local, mime, expected) and valid(remote, mime, expected) and local[-1] == remote[-1]
            print(port, path, 'HTTPS sem sessão', flush=True)
            anonymous = probe(HTTPSConnection(host, timeout=10), path)
            if expected in anonymous[-1]:
                print('O conteúdo do laboratório está acessível sem sessão.')
                ok = False
    print('HTML local e HTTPS conferem nas duas portas.' if ok else 'Divergência detectada. Confira as linhas acima.')
    return 0 if ok else 1


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (OSError, HTTPException) as exc:
        sys.exit('Falha de conexão na última etapa: ' + type(exc).__name__)
