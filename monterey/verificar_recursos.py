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
    print('App Intel contém extensão Safari, recursos e destino conferidos.')


if __name__ == '__main__':
    verify(Path(sys.argv[1]), Path(sys.argv[2]))
