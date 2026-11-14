on run
 set contentsDir to (POSIX path of (path to me)) & "Contents/"
 set resourcesDir to contentsDir & "Resources/Lab/"
 set tmp to do shell script "/usr/bin/mktemp -d"
 set taskPID to ""
 try
  do shell script "/bin/cp -R " & quoted form of (resourcesDir & "vault") & " " & quoted form of (tmp & "/vault")
  set taskPID to do shell script "/usr/bin/perl " & quoted form of (resourcesDir & "server.pl") & " " & quoted form of (tmp & "/vault") & " " & quoted form of (resourcesDir & "target") & " >" & quoted form of (tmp & "/log") & " 2>&1 </dev/null & echo $!"
  delay 1
  do shell script "/usr/bin/grep -qx READY " & quoted form of (tmp & "/log")
  do shell script "/usr/bin/open -a Safari http://localhost:8174/guia.html"
  set identifier to text returned of (display dialog "Ative Preenchô em Safari → Ajustes → Extensões. No cadastro de teste, abra a extensão, escolha Analisar esta aba e copie a origem em Configuração do laboratório." default answer "" with title "Conectar cofre de teste")
  do shell script "/usr/bin/printf '%s' " & quoted form of identifier & " | /usr/bin/grep -Eq '^safari-web-extension://[A-Za-z0-9.-]+$'"
  set cfg to "globalThis.approvalConfig={vault:'http://localhost:8173',target:'http://localhost:8174',extension:'" & identifier & "'};"
  do shell script "/usr/bin/printf '%s' " & quoted form of cfg & " > " & quoted form of (tmp & "/new") & " && /bin/mv " & quoted form of (tmp & "/new") & " " & quoted form of (tmp & "/vault/approval-config.js")
  display dialog "Siga o guia no Safari. Ao terminar o teste, clique em Encerrar." buttons {"Encerrar"}
 on error messageText number errNum
  if errNum is not -128 then display alert "Laboratório indisponível" message messageText
 end try
 if taskPID is not "" then
  try
   do shell script "/bin/kill " & quoted form of taskPID
  end try
 end if
 do shell script "/bin/rm -rf " & quoted form of tmp
end run
