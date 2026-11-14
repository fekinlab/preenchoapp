on run
 set targetURL to do shell script "/usr/bin/plutil -extract PreenchoTarget raw " & quoted form of ((POSIX path of (path to me)) & "Contents/Info.plist")
 if targetURL ends with ".example" then
  display alert "Build de integração" message "Este build verifica a extensão no Xcode. O destino definitivo será configurado antes da assinatura."
  return
 end if
 do shell script "/usr/bin/open -a Safari " & quoted form of targetURL
 display dialog "Ative Preenchô em Safari → Ajustes → Extensões. No cadastro, abra a extensão e revise os campos. O cofre solicitará sua autorização." buttons {"Concluir"}
end run
