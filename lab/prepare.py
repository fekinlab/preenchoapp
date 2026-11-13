"""Prepare isolated vault, target and unpacked extension directories for QA."""
import argparse
import json
import re
import shutil
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_VAULT = 'http://localhost:8173'
DEFAULT_TARGET = 'http://localhost:8174'


def origin(value):
    parts = urlsplit(value)
    if (parts.scheme != 'https' and not (parts.scheme == 'http' and parts.hostname == 'localhost')) or not parts.hostname or parts.username or parts.password or parts.netloc.endswith(':') or value != f'{parts.scheme}://{parts.netloc}':
        raise ValueError('Use uma origem HTTPS dedicada ou http://localhost:porta.')
    if parts.hostname == 'fekinlab.github.io':
        raise ValueError('A origem do aplicativo estável não pode ser usada no laboratório.')
    return value


def prepare(out, extension, vault=DEFAULT_VAULT, target=DEFAULT_TARGET):
    vault, target = origin(vault), origin(target)
    if vault == target:
        raise ValueError('O teste requer origens distintas.')
    if not re.fullmatch(r'(chrome-extension://[a-p]{32}|safari-web-extension://[A-Za-z0-9.-]+)', extension):
        raise ValueError('Copie a origem exata exibida na configuração da revisão.')
    out.mkdir(parents=True, exist_ok=True)
    if any(out.iterdir()):
        raise ValueError('Escolha um diretório de saída vazio.')
    site, dest = out / 'vault', out / 'target'
    site.mkdir()
    dest.mkdir()
    shutil.copytree(ROOT / 'extension', out / 'extension')
    cfg = dict(target=target, vault=vault)
    (out/'extension/lab-config.js').write_text('globalThis.labConfig = ' + json.dumps(cfg) + ';')
    (site/'approval-config.js').write_text('globalThis.approvalConfig = ' + json.dumps(dict(cfg, extension=extension)) + ';')
    html = (ROOT/'index.html').read_text().replace('</body>', '<script defer src="approval-config.js"></script><script defer src="approval.js"></script></body>')
    (site/'index.html').write_text(html)
    for name in ('app.js', 'cadastro-teste.html', 'cadastro-teste.js'):
        shutil.copy(ROOT/name, site/name)
    shutil.copy(ROOT/'lab/approval.js', site/'approval.js')
    shutil.copy(ROOT/'lab/form.html', dest/'index.html')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    parser.add_argument('--extension', required=True)
    parser.add_argument('--vault', default=DEFAULT_VAULT)
    parser.add_argument('--target', default=DEFAULT_TARGET)
    args = parser.parse_args()
    prepare(args.output, args.extension, args.vault, args.target)
