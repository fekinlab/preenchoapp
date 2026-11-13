'use strict';
(() => {
  // This state lives only in the extension's isolated world for this document.
  if (location.origin !== globalThis.labConfig.target || window !== window.top) return;
  const startURL = location.href;
  const ticket = crypto.randomUUID();
  const expires = Date.now() + 180000;
  const entries = new Map();
  function inspect(el) {
    if (!el.isConnected || !['text','tel','email','date','textarea','select-one'].includes(el.type) ||
        el.matches(':disabled,[readonly]') || el.closest('[hidden],[inert],[aria-hidden="true"]') ||
        !el.getClientRects().length || el.value || el.form?.autocomplete === 'off') return null;
    for (let p = el; p; p = p.parentElement) {
      const css = getComputedStyle(p);
      if (css.visibility !== 'visible' || css.opacity === '0' || css.display === 'none') return null;
    }
    const aria = (el.getAttribute('aria-labelledby') || '').split(/\s+/).slice(0,8)
      .map(id => document.getElementById(id)?.textContent || '').join(' ').trim();
    const label = aria || el.getAttribute('aria-label') || el.labels?.[0]?.textContent || '';
    const field = {type:el.type, label:label.trim().slice(0,120), name:el.name.slice(0,120),
      id:el.id.slice(0,120), placeholder:(el.placeholder || '').slice(0,120), ac:el.autocomplete};
    const kind = preenchoClassify(field);
    return kind && {kind, label:field.label || field.name || field.id || kind, signature:JSON.stringify(field)};
  }
  const fields = [];
  for (const el of Array.from(document.querySelectorAll('input,textarea,select')).slice(0,100)) {
    const info = inspect(el);
    if (!info) continue;
    const id = String(fields.length);
    entries.set(id, {el, ...info, form:el.form});
    fields.push({id, kind:info.kind, label:info.label});
  }
  globalThis.preenchoReview = {
    preview:{ticket, fields, url:startURL},
    apply(request, values) {
      if (request !== ticket || location.href !== startURL || Date.now() >= expires) return null;
      delete globalThis.preenchoReview;
      let filled = 0;
      for (const [id, value] of Object.entries(values)) {
        const entry = entries.get(id);
        if (!entry || typeof value !== 'string' || !value || value.length > 512 || location.href !== startURL) continue;
        const {el} = entry;
        if (el.form !== entry.form || inspect(el)?.signature !== entry.signature) continue;
        if (el.maxLength >= 0 && value.length > el.maxLength) continue;
        if (el.type === 'select-one' && !Array.from(el.options).some(o => o.value === value && !o.matches(':disabled'))) continue;
        el.value = value;
        if (el.value !== value || !el.validity.valid) { el.value = ''; continue; }
        filled++;
        el.dispatchEvent(new Event('input',{bubbles:true}));
        el.dispatchEvent(new Event('change',{bubbles:true}));
      }
      return filled;
    }
  };
})();
