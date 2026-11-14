#!/bin/bash
# Máquina de assinatura: identidades e perfil permanecem no Chaveiro.
set -euo pipefail
: "${DEVELOPER_ID:?Use o nome completo da identidade Developer ID Application no Chaveiro}"
: "${NOTARY_PROFILE:?Indique o perfil local do notarytool}"
case "$DEVELOPER_ID" in
  "Developer ID Application: "*) ;;
  *) echo "É necessária uma identidade Developer ID Application." >&2; exit 1 ;;
esac
input=${1:?Informe o app integrado}
[[ -d "$input/Contents/PlugIns" && "$input" == *.app ]]
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
app="$tmp/Preencho.app"
ditto "$input" "$app"
extensions=("$app"/Contents/PlugIns/*.appex)
[[ ${#extensions[@]} == 1 && -d "${extensions[0]}" ]]
# A extensão gerada usa sandbox. Transportar apenas entitlements de distribuição.
codesign -d --entitlements :- "${extensions[0]}" > "$tmp/extension.plist" 2>/dev/null
python3 - "$tmp/extension.plist" <<'PY'
import plistlib, sys
from pathlib import Path
path = Path(sys.argv[1])
entitlements = plistlib.loads(path.read_bytes())
entitlements.pop('com.apple.security.get-task-allow', None)
if entitlements.get('com.apple.security.app-sandbox') is not True:
    sys.exit('Sandbox da extensão ausente.')
path.write_bytes(plistlib.dumps(entitlements))
PY
codesign --force --timestamp --options runtime --entitlements "$tmp/extension.plist" --sign "$DEVELOPER_ID" "${extensions[0]}"
codesign --force --timestamp --options runtime --sign "$DEVELOPER_ID" "$app"
codesign --verify --strict --deep "$app"
ditto -c -k --keepParent "$app" "$tmp/submeter.zip"
xcrun notarytool submit "$tmp/submeter.zip" --keychain-profile "$NOTARY_PROFILE" --wait --output-format json > "$tmp/status.json"
python3 - "$tmp/status.json" <<'PY'
import json, sys
with open(sys.argv[1]) as source:
    result = json.load(source)
print("Notarização:", result.get("id"), result.get("status"))
if result.get("status") != "Accepted":
    sys.exit("Consulte o log desta submissão no notarytool.")
PY
xcrun stapler staple "$app"
ditto -c -k --keepParent "$app" "$tmp/final.zip"
mkdir "$tmp/conferencia"
ditto -x -k "$tmp/final.zip" "$tmp/conferencia"
final="$tmp/conferencia/Preencho.app"
codesign --verify --strict --deep "$final"
xcrun stapler validate "$final"
spctl --assess --type execute --verbose "$final"
mv "$tmp/final.zip" Preencho-Monterey-Notarizado.zip
shasum -a 256 Preencho-Monterey-Notarizado.zip | tee Preencho-Monterey-Notarizado.sha256
