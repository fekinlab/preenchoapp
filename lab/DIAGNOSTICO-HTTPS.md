# Download vazio no Safari

O iniciador confere os identificadores de saúde via HTTP local. Um resultado positivo ainda requer confirmação do encaminhamento HTTPS privado.

O teste local com servidores reais verifica HTTP 200, HTML específico do cofre ou cadastro, tamanho do corpo igual ao Content-Length e ausência de Content-Disposition nas rotas / e /index.html. Nesta investigação, os GET externos sem sessão em ambas as portas, inclusive /qa-health.txt, receberam HTTP 404 com corpo vazio e sem Content-Type, Content-Disposition ou Location. Essa observação não identifica a resposta recebida no iPhone.

No terminal do Codespace studious spork, execute:

    git pull --ff-only && python3 lab/diagnostico.py

O diagnóstico inicia ou reutiliza os servidores e compara os três caminhos via loopback e HTTPS autenticado. Também verifica se a rota de saúde entrega o marcador privado sem sessão. O script usa o token temporário da sessão apenas nos dois hosts previstos, via TLS, sem seguir redirecionamentos. Não solicita credenciais. A verificação não altera a visibilidade das portas.

Se o local passar e o HTTPS falhar, confira na aba Portas se as duas linhas estão presentes, com visibilidade Private e protocolo de origem HTTP. A URL externa usa HTTPS. Se ambos passarem, abra as portas pela própria aba Portas no Safari com a conta proprietária conectada. Um novo download nessa etapa exige examinar a navegação autenticada do Safari. Nunca compartilhe cookies, tokens ou URLs de login.

## Resultado observado no Codespace existente

O operador executou o diagnóstico em studious spork e obteve “HTML local e HTTPS conferem nas duas portas”. O painel Portas mostrou 8173 e 8174 como Private e o processo Python do laboratório nas duas linhas. Na porta 8174, /index.html respondeu HTTP 200 com text/html, 1.239 bytes e sem Content-Disposition tanto no acesso local quanto no HTTPS autenticado. A rota /qa-health.txt autenticada respondeu 200 com 19 bytes. Na mesma porta, sem sessão, a rota de saúde respondeu 302 com corpo vazio. O destino do redirecionamento não foi registrado.

O teste comprova a entrega autenticada dos documentos via cliente HTTP. Continua pendente observar o que o Safari do iPhone apresenta ao abrir cada porta com a conta proprietária conectada. A causa do download anterior e o funcionamento da extensão nesse dispositivo continuam em aberto.
