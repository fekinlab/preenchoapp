# Safari no iPhone: ensaio privado independente do encaminhamento do GitHub

As medições do Codespace demonstraram HTML idêntico em loopback e no HTTPS com token. O Safari ofereceu um download nos links diretos e na abertura da porta 8174 pelo editor. O status 302 sem sessão observado no Codespace é uma etapa intermediária. O alerta e o nome .dev não revelam status, MIME, disposição, cookies ou destino final. Um 404 vazio observado de outro cliente não identifica a resposta do telefone.

O teste WebKit em CI usa HTTP de loopback e uma sessão fictícia. Compara um redirecionamento com cookie e HTML final com uma navegação que entrega um anexo vazio. Não usa a sessão GitHub, o proxy real ou o Safari de um iPhone físico. O diagnóstico do Codespace compara as três rotas também sem sessão, informa a categoria do destino de redirecionamento e a presença de Set-Cookie. Não imprime cookies, destinos completos, consultas ou tokens.

## Alternativa de homologação física

Em um computador de QA confiável com Python 3 e um peer Tailscale já autorizado, é possível gerar o mesmo laboratório com duas origens HTTPS de uma rede privada. Requer o iPhone no mesmo tailnet, MagicDNS, HTTPS habilitado e política de acesso que permita somente os testadores nas portas 443 e 8443. Use peer dedicado, nome impessoal (certificados públicos têm registro de transparência) e confirme que as portas estão livres e sem configuração prévia de Serve ou Funnel. Não habilite Funnel. Nenhuma mudança é necessária no Codespace. Não criamos um tailnet nem cadastramos dispositivos.

Na branch de desenvolvimento, execute no peer substituindo o nome de exemplo pelo DNS completo atribuído ao dispositivo. A saída deve ser um diretório novo ou vazio:

    python3 lab/qa_tailnet.py qa.exemplo.ts.net qa-iphone

Mantenha o processo aberto. Em outro terminal do peer:

    tailscale serve --bg --https=443 http://127.0.0.1:8173
    tailscale serve --bg --https=8443 http://127.0.0.1:8174
    tailscale serve status

Com o Tailscale conectado no iPhone, abra no Safari os dois endereços impressos pelo Python. Espere a tela do cofre e o cadastro, respectivamente. Para homologar a extensão completa, empacote a pasta extension gerada e use a identidade real da extensão na opção --extension ao preparar o laboratório em outra pasta vazia. A identidade padrão unpaired serve apenas para verificar a navegação. Os sites têm o mesmo nome DNS e portas distintas, portanto origens distintas. Cookies têm escopo de host: este laboratório usa dados sintéticos e dispensa cookies de autenticação da aplicação.

Ao terminar, no peer dedicado:

    tailscale serve --https=443 off
    tailscale serve --https=8443 off

Interrompa o Python com Ctrl+C. O teste local automatizado verifica a preparação dos recursos e ambos os servidores de loopback. Certificado, ACL, acesso privado de ponta a ponta e Safari físico dependem de uma rede autorizada e de teste no aparelho.

## Para identificar o gatilho original

Se for indispensável confirmar a causa no Codespaces, examine a navegação com Web Inspector do Safari conectado ao aparelho em um Mac compatível. Registre só a sequência de status, categoria de host, MIME, disposição e tamanho da resposta final; verifique localmente se a sessão foi aceita. Não exporte o HAR bruto nem copie cabeçalhos de autenticação. O teste independente não exige essa coleta.

Referências: https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace e https://tailscale.com/docs/reference/tailscale-cli/serve
