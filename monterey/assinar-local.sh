#!/bin/bash
# Kit extraído de um run verificado. Não executa o candidato antes da notarização.
set -euo pipefail
cd "$(dirname "$0")"
[[ -f Preencho-Para-Assinatura.zip && -f Preencho-Para-Assinatura.sha256 ]]
shasum -a 256 -c Preencho-Para-Assinatura.sha256
for tool in notarytool stapler; do xcrun --find "$tool" >/dev/null; done
identities=$(security find-identity -v -p codesigning | sed -n 's/.*"\(Developer ID Application: [^"]*\)".*/\1/p')
if [[ -z "$identities" ]]; then
  echo "Crie Developer ID Application em Xcode → Preferences → Accounts → Manage Certificates." >&2
  exit 1
fi
if [[ -z "${DEVELOPER_ID:-}" ]]; then
  if [[ "$identities" == *$'\n'* ]]; then
    echo "Escolha uma das identidades locais:" >&2
    IFS=$'\n' read -r -d '' -a options < <(printf '%s\0' "$identities") || true
    select choice in "${options[@]}"; do
      if [[ -n "$choice" ]]; then DEVELOPER_ID=$choice; break; fi
    done
  else DEVELOPER_ID=$identities
  fi
fi
export DEVELOPER_ID
export NOTARY_PROFILE=${NOTARY_PROFILE:-Preencho-QA}
if ! xcrun notarytool history --keychain-profile "$NOTARY_PROFILE" >/dev/null 2>&1; then
  echo "Configure as credenciais diretamente na ferramenta Apple abaixo. Use uma senha específica de app."
  xcrun notarytool store-credentials "$NOTARY_PROFILE"
  xcrun notarytool history --keychain-profile "$NOTARY_PROFILE" >/dev/null
fi
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
ditto -x -k Preencho-Para-Assinatura.zip "$stage"
bash notarizar.sh "$stage/Preencho.app"
open -R Preencho-Monterey-Notarizado.zip
