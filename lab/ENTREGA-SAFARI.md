# Candidato Safari para Mac Intel

## Evidências e decisão de homologação

A issue #2 contém o ensaio físico de seleção no HTML isolado no Monterey e a reprodução do download no iPhone. O teste com token comparou as duas origens reais do Codespace. Chromium exercitou a extensão e o consentimento entre duas origens HTTPS. WebKit Linux com perfil móvel renderizou os documentos. O simulador iOS foi alvo de compilação. O build Intel verifica arquitetura e alvo mínimo 12.0. Nenhum desses resultados demonstra o fluxo completo na Safari Web Extension instalada no Mac.

| Caminho | Utilidade | Pré-requisito e custo operacional |
|---|---|---|
| Loopback no Mac | Ensaio rápido, offline, mesmo equipamento | Sem fornecedor. A modalidade atual usa HTTP local e não alcança o iPhone. |
| Codespace existente | Regressão e comparação com os testes anteriores | A conta precisa manter a sessão e o ambiente ativo. O acesso de navegador no iPhone continua bloqueado. |
| Tailscale Serve | Primeira homologação HTTPS independente do GitHub | Peer dedicado autorizado, ACL limitada aos testadores, HTTPS e iPhone/Mac na mesma rede privada. Usar infraestrutura já disponível. |
| DNS privado e servidor HTTPS próprio | Alternativa se a equipe já dispõe dessa rede | Exige administrar DNS, certificados válidos e controle de acesso. |
 
A causa do download continua aberta. As hipóteses são resposta intermediária ou final de login, cookie de sessão recusado ou particionado, resposta diferente do proxy para navegação, estado local da sessão, ou decisão de download do Safari. O teste de controle prova que redirecionar pode terminar em HTML normalmente. A extensão pode ser construída para o peer independente. Só uma inspeção da navegação real ou comparação física em outro ambiente pode distinguir as hipóteses. Evitar registrar URLs de retorno, cookies e tokens.

## Preparação pelo operador

1. Selecione um peer privado dedicado. Siga lab/SAFARI-PRIVADO.md para iniciar os serviços. Confirme em um cliente autorizado que o certificado é válido e que o cofre e o cadastro abrem. Confirme a restrição de acesso na política da rede.
2. Execute o workflow Homologação experimental na branch de desenvolvimento com o DNS do peer no campo qa_peer. O input é público para colaboradores com acesso a logs. Use um nome de QA impessoal. Sem peer configurado, o artefato usa o Codespace existente. Cada candidato fixa um único par de origens.
3. Baixe o artefato Preencho-Intel-Para-Assinatura. Confira o SHA-256 do ZIP interno e extraia-o com ditto em uma máquina de distribuição macOS confiável. Esse ZIP é insumo de assinatura. O operador confere o certificado Developer ID Application, a chave correspondente no Chaveiro e um perfil notarytool autorizado. Certificado iOS Distribution não atende esta distribuição.
4. Na máquina de assinatura, com DEVELOPER_ID e NOTARY_PROFILE apontando para os nomes locais, execute bash monterey/notarizar.sh /caminho/Preencho.app. A saída final exige status Accepted, ticket anexado, verificação da assinatura e aceite do Gatekeeper após extrair o ZIP. Use apenas dados de teste. A máquina de distribuição pode ser diferente do Monterey.
5. Entregue o ZIP notarizado e seu SHA-256. No Monterey, extraia, mova o app para Aplicativos, abra e ative a extensão nas preferências do Safari. O alvo de homologação é Safari 17.6 no Monterey 12.7.6. O suporte a MV3 e browser.scripting foi introduzido no Safari 15.4. A compatibilidade do conjunto de APIs será confirmada nesta versão específica.
6. Abra o cadastro, acione a extensão, expanda Configuração do laboratório e copie a origem exibida. Na máquina do peer, o operador executa python3 lab/parear_safari.py qa-iphone DNS-DO-PEER ORIGEM-DA-EXTENSAO. A origem não é segredo. O pareamento altera somente a configuração servida pelo cofre. Abra nova revisão. Crie perfil fictício, marque um campo, autorize no cofre e confirme na extensão. Confira que o outro campo ficou vazio. Repita com cancelamento, navegação de aba e campo preenchido manualmente. Registre a versão de Safari e do sistema.

## Revisão da proteção

O cofre v57 usa PBKDF2 e AES-GCM. Testes cobrem senha errada, integridade e chave não exportável. A extensão usa activeTab e scripting, injeta no quadro principal e restringe a revisão ao destino configurado. O cofre exige origem da extensão e janela esperadas, seleção de categorias e clique de autorização após desbloqueio. A escrita verifica documento, ticket, prazo, elemento, estado e valor atual. A página de destino passa a poder ler os valores liberados, inclusive em eventos input/change. O código não envia o formulário. O ensaio não certifica sites arbitrários, biometria nem segurança de uma página de destino não confiável.

Referências: Apple Safari 17.6 (https://support.apple.com/pt-br/120913), WebKit Safari 15.4 (https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/), Apple notarização (https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution).
