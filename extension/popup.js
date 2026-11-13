'use strict';
const api = globalThis.browser || chrome;
document.querySelector('#scan').onclick = async () => {
  try {
    const [tab] = await api.tabs.query({active:true,currentWindow:true});
    await api.tabs.create({url:api.runtime.getURL('review.html') + '#' + tab.id});
    window.close();
  } catch { document.querySelector('#status').textContent = 'Abra a extensão na aba do formulário.'; }
};
