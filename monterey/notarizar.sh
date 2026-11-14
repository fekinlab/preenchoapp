#!/bin/bash
# Executar apenas em um Mac de distribuição autorizado, com identidades no Chaveiro.
set -euo pipefail
: "${DEVELOPER_ID:?Indique a identidade Developer ID Application}"
: "${NOTARY_PROFILE:?Indique o perfil do notarytool no Chaveiro}"
app=${1:?Informe o bundle final com o iniciador e a extensão integrados}
[[ "$app" == *.app && -d "$app/Contents/PlugIns" ]]
for ext in "$app"/Contents/PlugIns/*.appex; do
  codesign --force --options runtime --timestamp --preserve-metadata=entitlements --sign "$DEVELOPER_ID" "$ext"
done
codesign --force --options runtime --timestamp --preserve-metadata=entitlements --sign "$DEVELOPER_ID" "$app"
codesign --verify --strict --deep "$app"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
ditto -c -k --keepParent "$app" "$tmp/submeter.zip"
xcrun notarytool submit "$tmp/submeter.zip" --keychain-profile "$NOTARY_PROFILE" --wait
xcrun stapler staple "$app"
xcrun stapler validate "$app"
spctl --assess --type execute --verbose "$app"
ditto -c -k --keepParent "$app" "$tmp/final.zip"
mv "$tmp/final.zip" Preencho-Monterey-Notarizado.zip
shasum -a 256 Preencho-Monterey-Notarizado.zip
