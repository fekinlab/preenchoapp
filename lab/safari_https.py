"""Prepare a Safari QA extension plus both static sites for dedicated HTTPS hosts."""
import argparse
import json
import re
from pathlib import Path
from prepare import prepare

def package(out, vault, target, identity):
    for value in (vault,target):
        if not re.fullmatch(r'https://[a-z0-9-]+(?:\.[a-z0-9-]+)+',value) or value.endswith('.'):
            raise ValueError('Use um host HTTPS dedicado, em minúsculas, sem caminho.')
    if vault == target:
        raise ValueError('O cofre e o formulário precisam de hosts distintos.')
    prepare(out,identity,vault,target)
    (out/'extension/lab-config.js').write_text('globalThis.labConfig = Object.freeze('+json.dumps(dict(vault=vault,target=target))+');')

if __name__ == '__main__':
    p=argparse.ArgumentParser()
    for key in ('vault','target','identity','output'):
        p.add_argument('--'+key,required=True)
    a=p.parse_args()
    package(Path(a.output),a.vault,a.target,a.identity)
