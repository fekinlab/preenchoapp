"""Pareia o cofre do peer de QA com a origem apresentada pela extensão instalada."""
import argparse
import fcntl
import json
import os
from pathlib import Path
import re
from tempfile import NamedTemporaryFile
from qa_tailnet import private_origins


def pair(output, host, identity):
    if (identity == 'safari-web-extension://unpaired' or
            not re.fullmatch(r'safari-web-extension://[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*', identity)):
        raise ValueError('Copie a origem inteira mostrada na extensão instalada.')
    vault, target = private_origins(host)
    config = output / 'vault/approval-config.js'
    # Este arquivo fica fora das duas pastas servidas. O lock cobre leitura e troca.
    with (output / '.pareamento.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        prefix = 'globalThis.approvalConfig = '
        source = config.read_text()
        if not source.startswith(prefix) or not source.endswith(';'):
            raise ValueError('Configuração do cofre inesperada.')
        data = json.loads(source[len(prefix):-1])
        if data['vault'] != vault or data['target'] != target:
            raise ValueError('O diretório pertence a outro laboratório.')
        if data['extension'] == identity:
            return
        if data['extension'] != 'safari-web-extension://unpaired':
            raise ValueError('Esta sessão já tem outra extensão pareada.')
        data['extension'] = identity
        with NamedTemporaryFile(mode='w', dir=config.parent, delete=False) as temp:
            temp.write(prefix + json.dumps(data) + ';')
        try:
            os.replace(temp.name, config)
        finally:
            Path(temp.name).unlink(missing_ok=True)



if __name__ == '__main__':
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('output', type=Path)
    args.add_argument('host')
    args.add_argument('identity')
    p = args.parse_args()
    pair(p.output, p.host, p.identity)
    print('Origem pareada. Abra uma nova revisão no Safari.')
