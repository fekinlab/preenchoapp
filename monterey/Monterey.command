#!/bin/bash
set -eu
cd "$(dirname "$0")"
alert(){ /usr/bin/osascript -e 'on run argv' -e 'display alert "Preenchô · Monterey" message (item 1 of argv)' -e 'end run' "$1"; }
vers=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' /Applications/Safari.app/Contents/Info.plist)
if [ "${vers%%.*}" -lt 17 ]; then alert "Este pacote requer Safari 17. Verifique a versão em Safari → Sobre o Safari."; exit 1; fi
tmp=$(mktemp -d)
cp -R vault "$tmp/vault"
# An unpaired vault never accepts a request from a browser extension.
printf '%s' 'globalThis.approvalConfig={};' > "$tmp/vault/approval-config.js"
/usr/bin/perl server.pl "$tmp/vault" target > "$tmp/log" 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; rm -rf "$tmp"' EXIT
for i in {1..30}; do grep -qx READY "$tmp/log" && break; sleep .1; done
if ! grep -qx READY "$tmp/log"; then alert "Feche o laboratório que já está aberto e tente novamente. As portas locais 8173 e 8174 precisam estar livres."; exit 1; fi
open "Preencho Lab.app" || { alert "O macOS bloqueou a abertura do app de desenvolvimento. Confira a mensagem no Finder."; exit 1; }
open -a Safari http://localhost:8174/guia.html
id=$(/usr/bin/osascript -e 'text returned of (display dialog "No Safari, abra Ajustes → Avançado e habilite os recursos para desenvolvedores. No menu Desenvolvedor (ou nos ajustes de desenvolvimento), permita extensões não assinadas para esta sessão. Ative Preenchô em Ajustes → Extensões. No guia, abra o cadastro fictício e use Preenchô → Analisar esta aba → Configuração do laboratório. Copie a origem exibida e cole abaixo." default answer "" with title "Conectar Safari")')
if [[ ! $id =~ ^safari-web-extension://[A-Za-z0-9.-]+$ ]]; then alert "A origem copiada não corresponde à extensão Safari."; exit 1; fi
printf 'globalThis.approvalConfig={"target":"http://localhost:8174","vault":"http://localhost:8173","extension":"%s"};' "$id" > "$tmp/config"
mv "$tmp/config" "$tmp/vault/approval-config.js"
open -a Safari http://localhost:8174/guia.html
/usr/bin/osascript -e 'display dialog "Siga o guia no Safari. Use somente o cofre fictício. Ao terminar, feche as abas, desative a extensão de teste e volte a desmarcar a permissão de extensões não assinadas." buttons {"Encerrar laboratório"}'
