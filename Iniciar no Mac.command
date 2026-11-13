#!/bin/bash
cd "$(dirname "$0")" || exit 1
if ! /usr/bin/python3 -c 'import sys; assert sys.version_info >= (3, 8)' >/dev/null 2>&1; then
  /usr/bin/osascript -e 'display alert "Preparar o Mac" message "Instale as ferramentas de desenvolvedor oferecidas pelo macOS ou o Xcode. Depois, abra este arquivo novamente."'
  exit 1
fi
exec /usr/bin/python3 -B lab/mac.py "$@"
