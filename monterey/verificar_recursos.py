"""Confere o app integrado antes de entregá-lo ao responsável pela assinatura."""
import json
import plistlib
import sys
from pathlib import Path


def verify(app, sites):
    def info(bundle):
        return plistlib.loads((bundle / 'Contents/Info.plist').read_bytes())

    host = info(app)
    extension, = (app / 'Contents/PlugIns').glob('*.appex')
    plugin = info(extension)
    if (not plugin['CFBundleIdentifier'].startswith(host['CFBundleIdentifier'] + '.') or
            plugin['NSExtension']['NSExtensionPointIdentifier'] != 'com.apple.Safari.web-extension'):
        raise ValueError('Identidade ou tipo da extensão inesperado.')
    for key in ('CFBundleVersion', 'CFBundleShortVersionString'):
        if not host.get(key) or host[key] != plugin.get(key):
            raise ValueError('Versões do app e da extensão divergentes.')
    for bundle, metadata in ((app, host), (extension, plugin)):
        binaries = list((bundle / 'Contents/MacOS').iterdir())
        if len(binaries) != 1 or binaries[0].name != metadata['CFBundleExecutable']:
            raise ValueError('Executável extra no bundle de distribuição.')
    source = sites / 'extension'
    manifest, = (extension / 'Contents/Resources').rglob('manifest.json')
    data = json.loads(manifest.read_text())
    if (data['manifest_version'] != 3 or set(data['permissions']) != {'activeTab', 'scripting'}
            or any(data.get(key) for key in ('host_permissions', 'optional_permissions',
                                             'optional_host_permissions', 'content_scripts'))):
        raise ValueError('Permissões do bundle divergentes.')
    for asset in source.iterdir():
        if asset.suffix in {'.js', '.html', '.css'}:
            if asset.read_bytes() != (manifest.parent / asset.name).read_bytes():
                raise ValueError('Recurso divergente: ' + asset.name)
    config = (sites / 'vault/approval-config.js').read_text()
    approved = json.loads(config.split(' = ', 1)[1].removesuffix(';'))
    if host['PreenchoTarget'] != approved['target']:
        raise ValueError('Destino do iniciador divergente.')
    if approved['target'] == 'http://localhost:8174':
        resources = app / 'Contents/Resources/Laboratorio'
        for name in ('vault', 'target'):
            for file in (sites / name).iterdir():
                if file.read_bytes() != (resources / name / file.name).read_bytes():
                    raise ValueError('Recurso do laboratório divergente: ' + file.name)
        if not (resources / 'server.pl').is_file():
            raise ValueError('Servidor integrado ausente.')
    print('App Intel contém extensão Safari, recursos e destino conferidos.')


if __name__ == '__main__':
    verify(Path(sys.argv[1]), Path(sys.argv[2]))
