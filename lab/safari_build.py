"""Gera uma extensão para exatamente o par de origens do perfil selecionado."""
import argparse
from pathlib import Path
from codespaces_qa import origins
from prepare import prepare
from qa_tailnet import private_origins


def configure(output, peer=None):
    hosts = (private_origins(peer) if peer else
             origins('studious-spork-9q6rg6v7x973pp96', 'app.github.dev'))
    prepare(output, 'safari-web-extension://unpaired', *hosts)
    return hosts


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('output', type=Path)
    parser.add_argument('--peer')
    args = parser.parse_args()
    print(*configure(args.output, args.peer))
