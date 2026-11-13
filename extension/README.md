# Preenchô — laboratório de extensão (v0.1)

Protótipo de extensão Manifest V3 para **identificar a estrutura** de formulários em uma página, após clique explícito do usuário.

## Segurança e escopo
- **Não lê os valores** digitados nos campos.
- **Não acessa** o cofre do Preenchô, localStorage, senha ou dados pessoais.
- **Não preenche nem envia** formulários.
- Permissões limitadas a `activeTab` e `scripting`; não usa permissões amplas para todos os sites.
- Não há conexão com servidor ou coleta de dados.
- Os metadados de campos aparecem apenas no popup local.

## Como testar
Carregue a pasta `extension/` como extensão descompactada em navegador Chromium de desenvolvimento que suporte Manifest V3. Abra uma página de teste e clique no ícone da extensão → **Analisar campos desta página**.

**Safari no iPhone:** estes arquivos não são instaláveis diretamente no Safari. É necessário empacotar uma Safari Web Extension com Xcode, assinar e distribuir um app contêiner para iOS. Esse processo ainda não foi realizado. A compatibilidade do código com Safari também precisa ser validada.

## Próximas etapas
1. Mapear campos conhecidos (nome, e-mail, CPF, telefone, endereço) sem coletar valores existentes.
2. Mostrar prévia dos campos e solicitar confirmação antes de preencher.
3. Criar ponte autenticada entre extensão e cofre, sem transmitir senha ou chave bruta.
4. Testar em páginas controladas, depois sites de terceiros com autorização.
5. Auditoria de segurança e privacidade antes de qualquer dado real.

**Importante:** não confundir este protótipo de inspeção com preenchimento em sites reais.
