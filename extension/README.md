# Preenchô — laboratório de extensão (v0.2)

Extensão experimental Manifest V3 para **reconhecer e revisar campos de formulários**, após ação explícita do usuário.

## O que funciona
- Ao clicar em **Analisar campos desta página**, lê somente metadados de até 100 campos da aba ativa (nome, ID, rótulo, placeholder, tipo e autocomplete).
- Reconhece possíveis campos de nome, e-mail, telefone, CPF, CNPJ, endereço, empresa e outros.
- Exibe a lista para o usuário marcar ou desmarcar e clicar em **Revisar seleção (simulação)**.
- Não acessa valores digitados, cofre, senha, chave criptográfica ou localStorage do Preenchô.
- Não preenche, não envia dados e não acessa servidores.

## Como testar no computador
No navegador Chromium de desenvolvimento, carregue a pasta `extension/` como extensão descompactada. Abra uma página de formulário e clique na extensão → **Analisar campos desta página** → revise os campos → **Revisar seleção (simulação)**.

## Limitações
- Identificação heurística: nomes ambíguos podem ser classificados incorretamente; o usuário deve revisar.
- O popup não guarda seleção e não fornece preenchimento real.
- Safari no iPhone requer empacotamento como Safari Web Extension via Xcode, assinatura e app contêiner iOS; ainda não disponível.
- Não usar dados reais. Falta auditoria de segurança.

## Próximas etapas
1. Criar testes de classificação e identificação de formulários dinâmicos.
2. Projetar a ponte de autorização entre extensão e cofre, evitando exposição de senha/chave.
3. Integrar preenchimento **somente após** confirmação por campo, com validação de origem.
4. Empacotar e testar no Safari em ambiente controlado.
