#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
umask 077
log=$(mktemp /tmp/preencho-qa.XXXXXX)
# Health contains only the site role. Check both exact responses on every launch.
healthy() {
  [ "$(curl -fsS --max-time 1 http://127.0.0.1:8173/qa-health.txt 2>/dev/null)" = 'preencho-vault-v2' ] &&
  [ "$(curl -fsS --max-time 1 http://127.0.0.1:8174/qa-health.txt 2>/dev/null)" = 'preencho-target-v2' ]
}
if healthy; then rm -f "$log"; exit 0; fi
nohup python3 -u lab/codespaces_qa.py >"$log" 2>&1 </dev/null &
pid=$!
i=0
while [ "$i" -lt 30 ]; do
  if healthy; then echo "Cofre e cadastro disponíveis no servidor local. HTTPS privado requer verificação separada."; exit 0; fi
  if ! kill -0 "$pid" 2>/dev/null; then break; fi
  sleep 0.2
  i=$((i+1))
done
echo "Falha ao iniciar as duas portas. Diagnóstico local: $log" >&2
exit 1
