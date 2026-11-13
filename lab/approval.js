'use strict';
(() => {
  // Installed only in the generated, isolated lab copy of the v57 app.
  if (location.search !== '?extension-approval' || !window.opener || window.top !== window) return;
  const peer = window.opener;
  const cfg = globalThis.approvalConfig;
  if (location.origin !== cfg.vault) return;
  const personal = ['name','birth','cpf','rg','email','phone','zip','street','number','complement','neighborhood','city','state'];
  const business = ['company','cnpj','role'];
  const dialog = document.createElement('dialog'), title = document.createElement('h2'),
    description = document.createElement('p'), confirm = document.createElement('button'), cancel = document.createElement('button');
  title.textContent = 'Autorizar uso do cofre de teste';
  confirm.textContent = 'Liberar campos selecionados'; cancel.textContent = 'Cancelar';
  dialog.append(title, description, confirm, cancel); document.body.append(dialog);
  const deadline = Date.now() + 180000;
  let request, ended = false;
  function stop() { ended = true; request = null; dialog.close(); window.close(); }
  window.addEventListener('pagehide', () => { ended = true; });
  cancel.onclick = stop;
  dialog.oncancel = stop;
  setTimeout(stop,180000);
  window.addEventListener('message', event => {
    if (ended || request || event.source !== peer || event.origin !== cfg.extension) return;
    const r = event.data;
    if (r?.type !== 'review' || r.origin !== cfg.target || !['personal','professional'].includes(r.profile) ||
        typeof r.ticket !== 'string' || !/^[0-9a-f-]{36}$/i.test(r.ticket) || !Array.isArray(r.kinds) ||
        !r.kinds.length || r.kinds.length > 16 || r.kinds.some(k => ![...personal,...business].includes(k))) return;
    request = r;
    const show = () => {
      if (ended) return;
      if (!vaultUnlocked) { setTimeout(show,300); return; }
      description.textContent = r.origin + ' · Perfil ' + (r.profile === 'personal' ? 'pessoal' : 'profissional') +
        ' · Campos: ' + r.kinds.map(k=>({name:'nome',birth:'nascimento',email:'e-mail',phone:'telefone',zip:'CEP',
        street:'rua',number:'número',complement:'complemento',neighborhood:'bairro',city:'cidade',state:'estado',
        company:'empresa',role:'cargo'}[k] || k.toUpperCase())).join(', ');
      dialog.showModal();
    };
    show();
  });
  confirm.onclick = e => {
    if (Date.now() >= deadline || !e.isTrusted || !request || !vaultUnlocked || ended || peer.closed) return stop();
    const p = JSON.parse(vaultGet(DATA_KEY) || '{}'), pro = JSON.parse(vaultGet(PROFILE_KEY) || '{}');
    const values = {};
    for (const kind of request.kinds) {
      let value = personal.includes(kind) ? p[kind] : undefined;
      if (request.profile === 'professional') {
        if (business.includes(kind)) value = pro[kind];
        if (kind === 'email') value = pro.businessEmail;
        if (kind === 'phone') value = pro.businessPhone;
      }
      if (typeof value === 'string' && value.trim() && value.length <= 512) values[kind] = value;
    }
    peer.postMessage({type:'approved',ticket:request.ticket,values},cfg.extension);
    stop();
  };
  peer.postMessage({type:'ready'},cfg.extension);
})();
