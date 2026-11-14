# Preenchô no MacBook Air 2015

**Este kit prepara a primeira assinatura.** A pasta do kit contém o candidato ZIP, o checksum interno e duas ferramentas para uso local. O aplicativo a instalar será o ZIP com “Notarizado” no nome, gerado no fim.

## Se este Mac também for assinar

1. Conecte o carregador. Em Safari → Sobre o Safari, confira a versão de homologação 17.6. Para usar este Mac como assinante, baixe o [Xcode 14.2 da Apple](https://developer.apple.com/download/all/?q=Xcode%2014.2), coloque em Aplicativos com o nome Xcode e abra uma vez para concluir a instalação. Se as ferramentas de linha de comando pedirem seleção, escolha Xcode 14.2 em Preferences → Locations → Command Line Tools.
2. Em Xcode → Preferences → Accounts, entre com sua conta de Account Holder. Em Manage Certificates, use uma identidade local Developer ID Application com a chave correspondente. Se precisar criar, escolha + → Developer ID Application. [Instruções Apple](https://developer.apple.com/help/account/certificates/create-developer-id-certificates). Não envie arquivos de chave ou senhas.
3. No run de homologação da branch dev/extensao-consentimento, baixe o artefato **Preencho-Intel-Para-Assinatura**. Expanda o ZIP externo e localize a pasta que contém assinar-local.sh. Abra Terminal, digite **bash** seguido de um espaço, arraste **assinar-local.sh** daquela pasta para a janela e pressione Return. O procedimento verifica o checksum interno e as ferramentas Apple, encontra a identidade e, quando necessário, abre a configuração do notarytool no Chaveiro. Use o Apple ID, Team ID e uma [senha específica de app](https://account.apple.com/) diretamente nesse diálogo do Terminal. O utilitário trabalha numa cópia. Aguarde Accepted e a abertura do Finder destacando **Preencho-Monterey-Notarizado.zip**. Se ocorrer erro, interrompa aqui.
4. Se outro Mac autorizado já assinou e entregou o ZIP notarizado, comece diretamente na instalação abaixo. Xcode só é necessário na máquina de assinatura.

## Instalar e testar

1. Expanda **Preencho-Monterey-Notarizado.zip**, mova **Preencho.app** para Aplicativos e abra pelo Finder. Mantenha a janela do Preenchô aberta. Se o Gatekeeper bloquear, pare e anote a mensagem.
2. No Safari, ative Preenchô em Preferências → Extensões. No cadastro fictício que o app abriu, clique na extensão. Em **Configuração do laboratório**, copie a origem inteira. Volte à janela do Preenchô, cole e clique em **Parear**.
3. No cadastro, abra a extensão novamente e marque apenas **Nome completo**. Abra o cofre. No primeiro uso, crie uma senha de teste e salve um nome inventado no perfil pessoal (se precisar prepará-lo antes, abra http://localhost:8173/ no Safari e inicie uma nova revisão após salvar). Autorize e confirme na extensão. Confira se o nome entrou e o e-mail ficou vazio. Clique em **Encerrar laboratório** na janela do aplicativo.

O modo padrão usa duas portas HTTP de loopback exclusivas do próprio Mac, sem VPN ou certificados locais. Fechar o laboratório encerra o servidor. O cofre de teste continua no armazenamento do Safari nessa origem. Dados existentes são preservados. A homologação HTTPS entre dispositivos segue em lab/SAFARI-PRIVADO.md e exige um peer suportado. O cliente Tailscale atual exige Ventura ou superior.

Se precisar informar um erro, envie somente a mensagem e a versão do Safari. Nunca envie tokens, senhas ou materiais privados do Chaveiro.
