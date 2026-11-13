'use strict';
// Shared by the isolated document scanner and the Node regression suite.
globalThis.preenchoClassify = function classify(field) {
  const normalize = value => (value || '').replace(/([a-z])([A-Z])/g, '$1 $2')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim();
  const tokens = (field.ac || '').toLowerCase().trim().split(/\s+/);
  const autocomplete = {name:'name', email:'email', tel:'phone', bday:'birth',
    'postal-code':'zip', 'address-line1':'street', 'address-line2':'complement',
    'address-level2':'city', 'address-level1':'state', organization:'company', 'organization-title':'role'};
  const hints = [field.label, field.name, field.id, field.placeholder].map(normalize);
  const combined = hints.join(' ');
  if (/\b(senha|password|token|pin|otp|cvv|cartao|card|login|usuario|username|pesquisa|search|confirm\w*|primeiro|primeira|sobrenome|first|last|given|family|mae|pai|responsavel|beneficiario|contato de emergencia|civil|fantasia)\b/.test(combined)) return null;
  const token = tokens.at(-1);
  if (token && token !== 'on' && !Object.hasOwn(autocomplete, token)) return null;
  if (tokens.slice(0,-1).some(t => !/^(section-[\w-]+|billing|shipping|work|home|mobile)$/.test(t))) return null;
  const rules = {
    name:/^(nome( completo)?|full name|name)$/, cpf:/\bcpf\b/, cnpj:/\bcnpj\b/,
    rg:/^rg( ficticio)?$/, email:/\be ?mail\b/, phone:/\b(telefone|celular|phone|tel|whatsapp)\b/,
    zip:/\b(cep|postal code|zip)\b/, street:/^(rua|logradouro|avenida|street|endereco|address line 1)$/,
    number:/^(numero (da residencia|do endereco|do imovel)|house number)$/,
    complement:/^(complemento|complement)$/, neighborhood:/^(bairro|neighborhood)$/,
    city:/\b(cidade|city)\b/, state:/^(estado|uf|state)$/, birth:/\b(nascimento|birth|birthday)\b/,
    company:/^(empresa|company|razao social|organization)$/, role:/\b(cargo|profissao|role|job title)\b/
  };
  const candidates = Object.entries(rules).filter(([,regex]) => hints.some(h => regex.test(h))).map(([kind]) => kind);
  if (Object.hasOwn(autocomplete, token)) candidates.push(autocomplete[token]);
  if (field.type === 'email') candidates.push('email');
  if (field.type === 'tel') candidates.push('phone');
  if (field.type === 'date') candidates.push('birth');
  const kinds = new Set(candidates);
  if (kinds.size !== 1 || (field.type === 'date' && !hints.some(h => rules.birth.test(h)) && token !== 'bday')) return null;
  return candidates[0];
};
