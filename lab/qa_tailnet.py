"""Prepara os recursos e serve o laboratório em loopback para um peer privado."""
import argparse
from contextlib import ExitStack
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
import re
from threading import Event, Thread

from codespaces_qa import Static
from prepare import prepare


def private_origins(host):
    label = r'[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?'
    if not re.fullmatch(fr'{label}\.{label}\.ts\.net', host):
        raise ValueError('Use o nome DNS completo do peer dedicado no tailnet.')
    return f'https://{host}', f'https://{host}:8443'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('host')
    parser.add_argument('output', type=Path)
    parser.add_argument('--extension', default='safari-web-extension://unpaired')
    args = parser.parse_args()
    origins = private_origins(args.host)
    with ExitStack() as stack:
        servers = []
        for port, site in ((8173, 'vault'), (8174, 'target')):
            handler = partial(Static, directory=str(args.output / site))
            servers.append(stack.enter_context(ThreadingHTTPServer(('127.0.0.1', port), handler)))
        prepare(args.output, args.extension, *origins)
        for server in servers:
            Thread(target=server.serve_forever, daemon=True).start()
            stack.callback(server.shutdown)
        print('Cofre e cadastro para Tailscale Serve:', *origins, flush=True)
        Event().wait()


if __name__ == '__main__':
    main()
