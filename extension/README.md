# Preenchô · extensão experimental 0.3.0

Esta branch continua a v57. O laboratório utiliza o mesmo app.js e um cofre fictício em outra origem. As únicas permissões são activeTab e scripting. A extensão opera por gesto na barra de ferramentas, no documento principal do destino configurado. O formulário de laboratório não possui botão de envio.

## Homologação local no Mac

1. Faça checkout desta branch. Crie um perfil de navegador de teste. No Chromium, em chrome://extensions, ative o modo do desenvolvedor e carregue a pasta extension/ diretamente. Copie o ID mostrado. Mantenha a pasta carregada no mesmo caminho.
2. Na raiz do repositório, execute os comandos abaixo em terminais distintos. Substitua ID_DA_EXTENSAO pelo ID instalado. O gerador exige saída vazia e Python 3. Em localhost, a pasta extension/ original já usa as duas portas corretas.
3. Abra http://localhost:8173 no perfil de teste. Crie o cofre, cadastre nome, e-mail e dados profissionais inventados e salve. Abra http://localhost:8174 em outra aba.
4. Nessa aba, clique no ícone da extensão e em **Analisar esta aba**. Confira a origem, marque apenas os campos desejados e escolha o perfil. Clique em **Abrir cofre de teste para autorizar**. Na nova aba, desbloqueie o cofre e clique em **Liberar campos selecionados**. Volte à aba de revisão e confirme o preenchimento. Confira o resultado na aba do cadastro.
5. Repita cancelando, deixando um campo já preenchido, trocando a página de destino antes de confirmar e aguardando três minutos. O cancelamento, a troca de documento e a expiração devem impedir a escrita. O campo ocupado deve ser preservado. Verifique também que o contato profissional usa o valor profissional e que a página continua sem envio.

~~~sh
python3 lab/prepare.py /tmp/preencho-qa --extension chrome-extension://ID_DA_EXTENSAO
python3 -m http.server 8173 --bind localhost --directory /tmp/preencho-qa/vault
python3 -m http.server 8174 --bind localhost --directory /tmp/preencho-qa/target
~~~

## Safari no Mac e no iPhone

- Instale Xcode compatível com o dispositivo. Para ensaio local no Safari do Mac, use a opção de extensão temporária do menu de desenvolvimento quando disponível. Para gerar o projeto contêiner, na raiz do checkout execute **xcrun safari-web-extension-packager ./extension**. Em versões anteriores do Xcode, consulte **xcrun safari-web-extension-converter --help**. Escolha macOS e iOS e inspecione os avisos de compatibilidade. O projeto gerado fica no Mac.
- No Xcode selecione os targets do aplicativo e da extensão, configure identificadores próprios e o mesmo Signing Team. Compile e execute o app contêiner. No iPhone físico, use um dispositivo pareado com Developer Mode habilitado e uma assinatura de desenvolvimento válida. Habilite a extensão nos ajustes do Safari. Conceda acesso apenas ao destino do teste.
- A identidade da extensão instalada no Safari pode diferir entre instalações. Abra a revisão pela extensão e expanda **Configuração do laboratório**. Copie a origem completa mostrada. Ela permanece visível mesmo se a análise falhar. Use-a como argumento de --extension.
- Para iPhone, localhost aponta para o próprio telefone. Prepare **duas origens HTTPS exclusivas de homologação**, com certificados aceitos pelo aparelho e sem redirecionamento. Execute o exemplo abaixo substituindo os três parâmetros. Sirva somente as pastas vault/ e target/ nas respectivas origens. No projeto Xcode, substitua o recurso lab-config.js pelo gerado em extension/lab-config.js, reconstrua e confira a origem instalada. Se ela mudou, gere novamente a configuração do cofre. O ID/URL não é segredo. Não use a origem da v57 para teste.
- As páginas do laboratório precisam permanecer fora de iframes. A ponte depende de window.opener e postMessage entre a página da extensão e o cofre. Uma política COOP que separe essas janelas, uma identidade divergente ou uma restrição do navegador deve bloquear o fluxo. Registre a etapa exata no Safari. Não libere origem curinga.
- Repita o roteiro do Mac em retrato e volte da aba do cofre para a revisão. Faça uma passagem com senha e outra com Face ID **ativado no cofre fictício da nova origem**. Verifique também troca de apps, cancelamento e expiração. Registre versões de iOS, Safari e Xcode, contagem preenchida e eventual erro, sem incluir valores do perfil.

~~~sh
python3 lab/prepare.py /tmp/preencho-ios --extension safari-web-extension://ID-EXIBIDO --vault https://cofre.qa.example --target https://form.qa.example
~~~

Referências Apple: [empacotamento](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari), [execução](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension), [assinatura](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension).
