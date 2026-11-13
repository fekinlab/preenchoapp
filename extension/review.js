'use strict';
const api = globalThis.browser || chrome;
const $ = id => document.getElementById(id);
const tabId = Number(location.hash.slice(1));
const target = {tabId,frameIds:[0]};
const names = {name:'Nome completo',cpf:'CPF',cnpj:'CNPJ',email:'E-mail',phone:'Telefone',birth:'Nascimento',rg:'RG',
  zip:'CEP',street:'Rua',number:'Número',complement:'Complemento',neighborhood:'Bairro',city:'Cidade',state:'Estado',company:'Empresa',role:'Cargo'};
const deadline = Date.now() + 180000;
let documentId, preview, vaultWindow, selected, values, done = false;
$('identity').textContent = location.origin;
function finish(message) {
  done = true;
  values = null;
  $('choices').disabled = $('authorize').disabled = $('apply').disabled = true;
  $('cancel').disabled = true;
  $('status').textContent = message;
  vaultWindow?.close();
}
async function scan() {
  const tab = await api.tabs.get(tabId);
  if (new URL(tab.url).origin !== labConfig.target) throw Error();
  await api.scripting.executeScript({target,files:['lab-config.js','classifier.js','scanner.js']});
  const [result] = await api.scripting.executeScript({target,func:() => globalThis.preenchoReview?.preview});
  documentId = result.documentId;
  preview = result.result;
  if (new URL(preview.url).origin !== labConfig.target) throw Error();
  $('origin').textContent = labConfig.target;
  for (const field of preview.fields) {
    const row = document.createElement('label'), box = document.createElement('input');
    box.type = 'checkbox'; box.value = field.id;
    row.append(box, document.createTextNode(' ' + names[field.kind] + ' — ' + field.label));
    $('fields').append(row);
  }
  $('status').textContent = preview.fields.length ? 'Selecione os campos. A autorização expira em três minutos.' : 'Nenhum campo compatível e vazio.';
}
$('choices').onchange = () => { $('authorize').disabled = !document.querySelector('input:checked'); };
$('authorize').onclick = () => {
  selected = preview.fields.filter(f => document.querySelector('input[value="'+f.id+'"]').checked);
  if (!selected.length || done) return;
  vaultWindow = window.open(labConfig.vault + '/?extension-approval', '_blank');
  if (!vaultWindow) { $('status').textContent = 'Permita a abertura da aba do cofre e tente novamente.'; return; }
  $('choices').disabled = $('authorize').disabled = true;
  $('status').textContent = 'Desbloqueie o cofre de teste e revise os campos na nova aba.';
};
window.addEventListener('message', e => {
  if (Date.now() >= deadline) return finish('Autorização expirada.');
  if (done || !vaultWindow || e.source !== vaultWindow || e.origin !== labConfig.vault) return;
  const msg = e.data;
  if (msg?.type === 'ready') {
    vaultWindow.postMessage({type:'review',ticket:preview.ticket,origin:labConfig.target,profile:$('profile').value,
      kinds:[...new Set(selected.map(f => f.kind))]},labConfig.vault);
  } else if (msg?.type === 'approved' && msg.ticket === preview.ticket && !values) {
    values = {};
    for (const f of selected) {
      const value = msg.values?.[f.kind];
      if (typeof value === 'string' && value.length && value.length <= 512) values[f.id] = value;
    }
    vaultWindow.close(); vaultWindow = null;
    const count = Object.keys(values).length;
    if (!count) return finish('Perfil sem dados para os campos selecionados.');
    $('apply').hidden = false;
    $('status').textContent = count + ' de ' + selected.length + ' campos com dados autorizados. Confira o destino e confirme.';
  }
});
$('apply').onclick = async () => {
  if (done || !values) return;
  if (Date.now() >= deadline) return finish('Autorização expirada.');
  const approved = values;
  finish('Preenchendo…');
  try {
    const tab = await api.tabs.get(tabId);
    if (tab.url !== preview.url) throw Error();
    const destination = documentId ? {tabId,documentIds:[documentId]} : target;
    const [r] = await api.scripting.executeScript({target:destination,args:[preview.ticket, approved],
      func:(ticket, data) => globalThis.preenchoReview?.apply(ticket, data) ?? null});
    $('status').textContent = Number.isInteger(r.result) ? r.result + ' de ' + selected.length + ' campos preenchidos. Revise na aba original.' : 'Documento alterado ou autorização expirada. Analise novamente.';
  } catch { $('status').textContent = 'A aba ficou indisponível. Confira o formulário antes de tentar novamente.'; }
};
$('cancel').onclick = () => finish('Operação cancelada.');
window.addEventListener('pagehide', () => finish('Revisão encerrada.'));
setTimeout(() => { if (!done) finish('Autorização expirada. Analise novamente.'); },180000);
scan().catch(() => finish('Abra a extensão pelo formulário na origem de teste configurada.'));
