const {test} = require('node:test');
const assert = require('node:assert/strict');
require('../extension/classifier.js');
for (const [field, expected] of [
  [{name:'cpf_cliente'},'cpf'], [{name:'dataNascimento'},'birth'], [{label:'CNPJ'},'cnpj'],
  [{label:'Nome completo'},'name'], [{type:'email'},'email'], [{type:'tel'},'phone'],
  [{label:'CEP'},'zip'], [{label:'Rua'},'street'], [{label:'Número do imóvel'},'number'],
  [{label:'Complemento'},'complement'], [{label:'Bairro'},'neighborhood'], [{label:'Cidade'},'city'],
  [{label:'Estado'},'state'], [{ac:'section-work shipping organization'},'company'], [{label:'Cargo'},'role'],
  [{label:'CPF / CNPJ'},null], [{label:'CPF',ac:'email'},null], [{label:'E-mail',ac:'off'},null],
  [{label:'Estado civil'},null], [{label:'Nome da mãe'},null], [{ac:'given-name'},null], [{ac:'family-name'},null],
  [{ac:'one-time-code',type:'tel'},null], [{label:'Número'},null], [{id:'custom_x'},null],
  [{label:'Senha',ac:'email'},null], [{type:'date',label:'Data do evento'},null], [{ac:'cc-number'},null],
  [{ac:'address-line1',label:'Cidade'},null], [{ac:'email',label:'Confirmar e-mail'},null],
]) test(JSON.stringify(field), () => assert.equal(preenchoClassify(field), expected));
