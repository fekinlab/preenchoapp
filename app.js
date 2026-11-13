
/* Cofre local experimental: AES-GCM e PBKDF2, segredo nunca persistido. */
const VAULT_KEY='preencho_vault_v1';
const LEGACY_KEYS=['preencho_demo_data_v1','preencho_demo_professional_v1'];
let vaultUnlocked=false,vaultKey=null,vaultContents={};
const encoder=new TextEncoder(),decoder=new TextDecoder();
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));
const unb64=s=>Uint8Array.from(atob(s),x=>x.charCodeAt(0));
function vaultGet(k){return vaultUnlocked?(vaultContents[k]??null):null}
function vaultSet(k,v){if(!vaultUnlocked)throw Error('Cofre bloqueado');vaultContents[k]=v;return persistVault()}
function vaultRemove(k){if(!vaultUnlocked)throw Error('Cofre bloqueado');delete vaultContents[k];return persistVault()}
async function deriveVaultKey(pass,salt){
 const material=await crypto.subtle.importKey('raw',encoder.encode(pass),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function persistVault(){
 const old=localStorage.getItem(VAULT_KEY);
 if(!old||!vaultKey)throw Error('Cofre não inicializado');
 const record=JSON.parse(old),iv=crypto.getRandomValues(new Uint8Array(12));
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},vaultKey,encoder.encode(JSON.stringify(vaultContents)));
 localStorage.setItem(VAULT_KEY,JSON.stringify({...record,iv:b64(iv),ciphertext:b64(ciphertext)}));
}
function vaultLock(){vaultUnlocked=false;vaultKey=null;vaultContents={};renderVaultGate()}
function renderVaultGate(){
 const gate=document.getElementById('vault-gate');if(!gate)return;
 gate.hidden=vaultUnlocked;
 const exists=!!localStorage.getItem(VAULT_KEY);
 document.getElementById('vault-title').textContent=exists?'Desbloquear cofre':'Criar cofre de teste';
 document.getElementById('vault-submit').textContent=exists?'Desbloquear':'Criar cofre';
 document.getElementById('vault-confirm-wrap').hidden=exists;
 document.getElementById('vault-import').hidden=!vaultUnlocked||!LEGACY_KEYS.some(k=>localStorage.getItem(k));
 document.getElementById('vault-lock').hidden=!vaultUnlocked;
 document.getElementById('vault-pass').value='';
 document.getElementById('vault-confirm').value='';
 document.getElementById('vault-status').textContent='';
}
async function vaultSubmit(event){
 event.preventDefault();
 const status=document.getElementById('vault-status'),pass=document.getElementById('vault-pass').value;
 const old=localStorage.getItem(VAULT_KEY);
 if(pass.length<12){status.textContent='Use uma senha de pelo menos 12 caracteres.';return}
 if(!old&&pass!==document.getElementById('vault-confirm').value){status.textContent='As senhas não coincidem.';return}
 const btn=document.getElementById('vault-submit');btn.disabled=true;
 try{
  if(old){
   const record=JSON.parse(old),key=await deriveVaultKey(pass,unb64(record.salt));
   const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(record.iv)},key,unb64(record.ciphertext));
   const parsed=JSON.parse(decoder.decode(plain));
   if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('Dados inválidos');
   vaultKey=key;vaultContents=parsed;
  }else{
   const salt=crypto.getRandomValues(new Uint8Array(16));
   vaultKey=await deriveVaultKey(pass,salt);vaultContents={};
   const iv=crypto.getRandomValues(new Uint8Array(12));
   const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},vaultKey,encoder.encode('{}'));
   localStorage.setItem(VAULT_KEY,JSON.stringify({version:1,kdf:'PBKDF2-SHA256',iterations:600000,salt:b64(salt),iv:b64(iv),ciphertext:b64(encrypted)}));
  }
  vaultUnlocked=true;renderVaultGate();go('home');
 }catch(e){vaultKey=null;vaultContents={};vaultUnlocked=false;status.textContent='Não foi possível abrir o cofre. Verifique a senha e tente novamente.'}
 finally{btn.disabled=false}
}
async function vaultImport(){
 if(!vaultUnlocked)return;
 const data={...vaultContents};
 for(const k of LEGACY_KEYS){const value=localStorage.getItem(k);if(value!==null){JSON.parse(value);data[k]=value}}
 const previous=vaultContents;vaultContents=data;
 try{await persistVault();for(const k of LEGACY_KEYS)localStorage.removeItem(k);document.getElementById('vault-import').hidden=true;go('home');alert('Dados fictícios antigos migrados e cópias antigas removidas deste navegador.')}
 catch(e){vaultContents=previous;alert('Falha na migração. Dados antigos mantidos.')}
}
function vaultShowControls(){const gate=document.getElementById('vault-gate');gate.hidden=false;document.getElementById('vault-title').textContent='Cofre desbloqueado';document.getElementById('vault-submit').hidden=true;document.getElementById('vault-confirm-wrap').hidden=true;document.getElementById('vault-pass').hidden=true;document.getElementById('vault-import').hidden=!LEGACY_KEYS.some(k=>localStorage.getItem(k));document.getElementById('vault-lock').hidden=false;}
document.getElementById('vault-form').addEventListener('submit',vaultSubmit);
document.getElementById('vault-lock').addEventListener('click',vaultLock);
document.getElementById('vault-import').addEventListener('click',vaultImport);
document.getElementById('vault-close').addEventListener('click',()=>{if(vaultUnlocked)document.getElementById('vault-gate').hidden=true});
renderVaultGate();


const brandify=t=>t.replaceAll('Preenchô','<span class="brand-inline">Preench<span class="accent">ô</span></span>');const logo='<div class="wordmark"><svg class="mark" viewBox="0 0 64 70" aria-hidden="true"><path d="M8 24 31 5Q33 3 36 5L57 24" fill="none" stroke="#ff850e" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 32v21q0 9 9 9h29q9 0 9-9V33" fill="none" stroke="#b7c4d6" stroke-width="8" stroke-linecap="round"/><path d="M22 31h23M22 42h23M22 53h16" stroke="white" stroke-width="6" stroke-linecap="round"/><path d="M38 54 L40 56 L44 51" fill="none" stroke="#ff8a18" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="brandtext">Preench<span class="accent">ô</span></span></div>';
const back='<button class="back" data-action="go(\'home\')">‹ Voltar</button>';
const action=(icon,label,page)=>'<button class="action" data-action="go(\''+page+'\')"><span class="ico">'+icon+'</span><span class="action-label">'+label+'</span><span class="chev">›</span></button>';
const screens={
home:()=>'<h1 class="hello" id="home-greeting">Olá, seja bem-vindo!</h1><p class="lead">Precisou preencher? <span class="brand-inline">Preench<span class="accent">ô</span></span>!</p><p class="sub">Cadastre seus dados uma única vez e preencha formulários em sites e aplicativos compatíveis em segundos.</p><button class="primary" data-action="go(\'data\')"><span class="glyph">♙</span>Meus dados<span class="arrow">›</span></button>'+action('▱','Meus perfis','profiles')+action('▣','Meu Cartão Preenchô','card')+'<div class="panel"><div class="label">Preenchimento inteligente</div><div class="small">Em desenvolvimento: preenchimento em sites compatíveis, com sua autorização. A demonstração interna saiu da navegação principal.</div></div>',
fill:()=>back+'<div class="page"><h1>Preencher formulário</h1><p class="desc">Teste o preenchimento automático com seus dados fictícios salvos neste navegador.</p><div class="panel"><label class="data-field"><span>Perfil para preenchimento</span><select id="fill-profile" style="width:100%;border:1px solid #4c6684;background:#122946;color:white;border-radius:14px;padding:15px;font-size:16px"><option value="personal">Pessoal</option><option value="professional">Profissional (dados pessoais + empresa)</option></select></label></div><div class="panel"><h2 style="margin-top:0;font-size:19px">Formulário de teste</h2><form id="demo-form" data-submit="finishDemo(event)">'+[['name','Nome completo'],['birth','Data de nascimento'],['cpf','CPF'],['rg','RG'],['phone','Telefone'],['email','E-mail'],['zip','CEP'],['street','Rua / Avenida'],['number','Número'],['neighborhood','Bairro'],['city','Cidade'],['state','Estado'],['company','Empresa'],['role','Cargo'],['cnpj','CNPJ']].map(x=>'<label class="data-field"><span>'+x[1]+'</span><input name="'+x[0]+'" type="'+(x[0]==='birth'?'date':'text')+'" autocomplete="off" placeholder="Aguardando preenchimento"></label>').join('')+'<button class="primary" type="button" data-action="autoFillDemo()">Preencher automaticamente ›</button><button class="secondary" type="button" data-action="clearDemo()">Limpar formulário</button><button class="secondary" type="submit">Concluir teste</button><p id="fill-status" class="note" role="status"></p></form></div><p class="note">Demonstração local: nenhum dado é enviado. Confira os campos antes de concluir. Use somente dados fictícios.</p></div>',
data:()=>back+'<div class="page"><h1>Meus dados</h1><p class="desc">Preencha apenas o que desejar, usando dados fictícios nesta versão de testes. As informações ficam somente neste navegador.</p><form id="data-form" data-submit="saveData(event)"><section class="data-group"><h2>Dados pessoais</h2><label class="data-field"><span>Nome completo</span><input name="name" type="text" placeholder="Nome de teste" autocomplete="off" maxlength="120"></label><label class="data-field"><span>Data de nascimento</span><input name="birth" type="date" placeholder="" autocomplete="off" maxlength="120"></label><label class="data-field"><span>CPF fictício</span><input name="cpf" type="text" placeholder="000.000.000-00" autocomplete="off" maxlength="120"></label></section><section class="data-group"><h2>Contato</h2><label class="data-field"><span>Celular / WhatsApp</span><input name="phone" type="tel" placeholder="(00) 00000-0000" autocomplete="off" maxlength="120"></label><label class="data-field"><span>E-mail</span><input name="email" type="email" placeholder="teste@exemplo.com" autocomplete="off" maxlength="120"></label><label class="data-field"><span>Telefone alternativo</span><input name="phone2" type="tel" placeholder="(00) 0000-0000" autocomplete="off" maxlength="120"></label></section><section class="data-group"><h2>Endereço</h2><label class="data-field"><span>CEP</span><input name="zip" type="text" placeholder="00000-000" autocomplete="off" maxlength="120"></label><label class="data-field"><span>Rua / Avenida</span><input name="street" type="text" placeholder="Nome da rua" autocomplete="off" maxlength="120"></label><label class="data-field"><span>Número</span><input name="number" type="text" placeholder="123" autocomplete="off" maxlength="120"></label><label class="data-field"><span>Complemento</span><input name="complement" type="text" placeholder="Apto / bloco" autocomplete="off" maxlength="120"></label><label class="data-field"><span>Bairro</span><input name="neighborhood" type="text" placeholder="Bairro" autocomplete="off" maxlength="120"></label><label class="data-field"><span>Cidade</span><input name="city" type="text" placeholder="Cidade" autocomplete="off" maxlength="120"></label><label class="data-field"><span>Estado (UF)</span><input name="state" type="text" placeholder="SP" autocomplete="off" maxlength="120"></label><label class="data-field"><span>País</span><input name="country" type="text" placeholder="Brasil" autocomplete="off" maxlength="120"></label></section><details class="data-group optional-group"><summary>Mais informações (opcional)</summary><label class="data-field"><span>Nome social</span><input name="socialName" type="text" placeholder="" autocomplete="off" maxlength="120"></label><label class="data-field"><span>RG fictício</span><input name="rg" type="text" placeholder="" autocomplete="off" maxlength="120"></label><label class="data-field"><span>Órgão emissor</span><input name="issuer" type="text" placeholder="" autocomplete="off" maxlength="120"></label><label class="data-field"><span>Nacionalidade</span><input name="nationality" type="text" placeholder="" autocomplete="off" maxlength="120"></label><label class="data-field"><span>Estado civil</span><input name="marital" type="text" placeholder="" autocomplete="off" maxlength="120"></label><label class="data-field"><span>Profissão</span><input name="occupation" type="text" placeholder="" autocomplete="off" maxlength="120"></label><label class="data-field"><span>Observações</span><input name="notes" type="text" placeholder="" autocomplete="off" maxlength="120"></label></details><button class="primary" type="submit">Salvar meus dados</button><p id="save-status" class="note" role="status"></p></form><button class="secondary" data-action="clearData()">Apagar dados deste navegador</button><p class="note">Ainda não há conta, sincronização ou proteção adequada para informações sensíveis reais.</p></div>',
profiles:()=>back+'<div class="page"><h1>Meus perfis</h1><p class="desc">Separe informações por contexto. Nesta versão, use apenas dados fictícios.</p><div class="panel"><div class="label">Perfil pessoal</div><div class="value">Utiliza os dados de Meus Dados <span class="pill">Principal</span></div><button class="secondary" data-action="go(\'data\')">Editar dados pessoais</button></div><div class="panel"><div class="label">Perfil profissional</div><div class="value">Informações para cadastros profissionais</div></div><form id="professional-form" data-submit="saveProfessional(event)">'+[['company','Empresa / nome fantasia'],['role','Cargo / profissão'],['businessEmail','E-mail profissional'],['businessPhone','Telefone profissional'],['cnpj','CNPJ fictício'],['legalName','Razão social']].map(x=>'<label class="data-field"><span>'+x[1]+'</span><input name="'+x[0]+'" type="text" autocomplete="off" maxlength="120" placeholder="Opcional"></label>').join('')+'<button class="primary" type="submit">Salvar perfil profissional</button><p id="profile-status" class="note" role="status"></p></form><p class="note">Os perfis são independentes e ficam salvos apenas neste navegador. Não use documentos reais nesta fase.</p></div>',
card:()=>{let d={};try{d=JSON.parse(vaultGet('preencho_demo_data_v1')||'{}')||{}}catch(e){}const safe=v=>String(v||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));const items=[['CPF','cpf',true],['RG','rg',true],['Nascimento','birth',false],['Telefone','phone',false],['E-mail','email',false],['CEP','zip',false]].filter(x=>d[x[1]]);const formatted=(k,v)=>k==='birth'&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v.slice(8,10)+'/'+v.slice(5,7)+'/'+v.slice(0,4):v;return back+'<div class="page"><h1>Meu Cartão Preenchô</h1><p class="desc">Seus dados de consulta rápida, em um só lugar.</p><div class="wallet"><div class="wallet-top">'+logo+'<span class="pill">Pessoal</span></div><div class="label" style="letter-spacing:1px">MEU CARTÃO DIGITAL</div><div class="wallet-name">'+safe(d.name||'Seu nome aqui')+'</div><div class="wallet-details" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px">'+(items.length?items.map(x=>'<div style="min-width:0;overflow-wrap:anywhere"><div class="label" style="color:#52637c">'+x[0]+'</div><div style="font-weight:650;font-size:13px" id="card-'+x[1]+'">'+(x[2]?'••••••••':safe(formatted(x[1],x[1]==='rg'?d.rg:d[x[1]])))+'</div><div style="display:flex;gap:10px;margin-top:7px">'+(x[2]?'<button type="button" class="card-mini" data-action="toggleCardField(\''+x[1]+'\')">Mostrar</button>':'')+'<button type="button" class="card-mini" data-action="copyCardField(\''+x[1]+'\')"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button></div></div>').join(''):'<p>Cadastre seus dados para visualizar o cartão.</p>')+'</div></div><p id="card-status" class="note" role="status"></p><button class="secondary" data-action="go(\'data\')">Editar meus dados</button><p class="note">Somente campos preenchidos aparecem. CPF e RG ficam ocultos até você tocar no ícone do olho. Use dados fictícios nesta versão de testes. Este cartão não substitui um documento oficial.</p></div>'},
settings:()=>back+'<div class="page"><h1>Ajustes</h1><p class="desc">Em breve: proteção de dados, autenticação e preferências.</p><div class="panel">Preenchô · Protótipo visual</div></div>'
};
function cardFieldValue(key){try{const d=JSON.parse(vaultGet('preencho_demo_data_v1')||'{}')||{};return String(d[key]||'')}catch(e){return ''}}
function toggleCardField(key){if(key!=='cpf'&&key!=='rg')return;const el=document.getElementById('card-'+key);if(!el)return;const button=el.parentElement.querySelector('button');const hidden=el.textContent==='••••••••';el.textContent=hidden?cardFieldValue(key):'••••••••';if(button){button.innerHTML=hidden?'<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.7-7 10-7 10 7 10 7-3.7 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>':'<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7"/><path d="M9.9 5.3A10.8 10.8 0 0 1 12 5c5.1 0 8.8 4.5 10 7a13.6 13.6 0 0 1-3.2 4.4M6.2 6.2C3.9 7.7 2.5 10 2 12c1.2 2.5 4.9 7 10 7 1.3 0 2.5-.3 3.6-.8"/></svg>';button.setAttribute('aria-label',(hidden?'Ocultar ':'Mostrar ')+key.toUpperCase());button.title=(hidden?'Ocultar ':'Mostrar ')+key.toUpperCase()}}
function copyCardField(key){const allowed=['cpf','rg','birth','phone','email','zip'];if(!allowed.includes(key))return;const v=cardFieldValue(key);const s=document.getElementById('card-status');if(!v)return;const done=()=>{if(s)s.textContent='Dado copiado.'};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(v).then(done).catch(()=>{if(s)s.textContent='Não foi possível copiar neste navegador.'})}else{if(s)s.textContent='Cópia não disponível neste navegador.'}}
function autoFillDemo(){const form=document.getElementById('demo-form'),status=document.getElementById('fill-status');if(!form)return;let p={},pro={};try{p=JSON.parse(vaultGet('preencho_demo_data_v1')||'{}')||{};pro=JSON.parse(vaultGet('preencho_demo_professional_v1')||'{}')||{}}catch(e){status.textContent='Não foi possível ler os dados salvos.';return}const professional=document.getElementById('fill-profile').value==='professional';const values={...p};if(professional){values.company=pro.company||'';values.role=pro.role||'';values.cnpj=pro.cnpj||'';values.email=pro.businessEmail||p.email||'';values.phone=pro.businessPhone||p.phone||''}let count=0;form.querySelectorAll('input[name]').forEach(input=>{const v=values[input.name];if(typeof v==='string'&&v.trim()){input.value=v;count++}});status.textContent=count?count+' campos preenchidos automaticamente. Revise os dados antes de concluir.':'Nenhum dado cadastrado encontrado. Preencha Meus Dados primeiro.'}
function clearDemo(){const f=document.getElementById('demo-form');if(f)f.reset();const s=document.getElementById('fill-status');if(s)s.textContent='Formulário limpo.'}
function finishDemo(e){e.preventDefault();const s=document.getElementById('fill-status');if(s)s.textContent='Teste concluído! Nenhum dado foi enviado ou armazenado.'}
const DATA_KEY='preencho_demo_data_v1';function loadData(){try{const v=JSON.parse(vaultGet(DATA_KEY)||'{}');document.querySelectorAll('#data-form input').forEach(i=>i.value=typeof v[i.name]==='string'?v[i.name]:'')}catch(e){const s=document.getElementById('save-status');if(s)s.textContent='Não foi possível ler os dados salvos.'}}async function saveData(e){e.preventDefault();const obj={};document.querySelectorAll('#data-form input').forEach(i=>obj[i.name]=i.value.trim());const s=document.getElementById('save-status');try{await vaultSet(DATA_KEY,JSON.stringify(obj));s.textContent='Dados de teste salvos neste navegador ✓'}catch(err){s.textContent='Não foi possível salvar. Verifique as configurações do navegador.'}}async function clearData(){try{await vaultRemove(DATA_KEY);document.querySelectorAll('#data-form input').forEach(i=>i.value='');const s=document.getElementById('save-status');if(s)s.textContent='Dados locais apagados.'}catch(e){alert('Não foi possível apagar os dados.')}}const PROFILE_KEY='preencho_demo_professional_v1';function loadProfessional(){try{const v=JSON.parse(vaultGet(PROFILE_KEY)||'{}');document.querySelectorAll('#professional-form input').forEach(i=>i.value=typeof v[i.name]==='string'?v[i.name]:'')}catch(e){const s=document.getElementById('profile-status');if(s)s.textContent='Não foi possível carregar o perfil.'}}async function saveProfessional(e){e.preventDefault();const v={};document.querySelectorAll('#professional-form input').forEach(i=>v[i.name]=i.value.trim());const s=document.getElementById('profile-status');try{await vaultSet(PROFILE_KEY,JSON.stringify(v));s.textContent='Perfil profissional salvo neste navegador ✓'}catch(e){s.textContent='Não foi possível salvar o perfil.'}}function go(page){document.getElementById('screen').innerHTML=brandify((screens[page]||screens.home)());document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));if(page==='home'){let name='';try{const saved=JSON.parse(vaultGet('preencho_demo_data_v1')||'{}');name=typeof saved.name==='string'?saved.name.trim():''}catch(e){}const greeting=document.getElementById('home-greeting');if(greeting)greeting.textContent=name?'Olá, '+name.split(/\s+/)[0]+'!':'Olá, seja bem-vindo!'}if(page==='data')loadData();if(page==='settings'){const btn=document.getElementById('vault-open');if(btn)btn.addEventListener('click',vaultShowControls)}if(page==='profiles')loadProfessional();window.scrollTo(0,0)}document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));try{go('home')}catch(err){document.getElementById('screen').innerHTML='<h1>Preenchô</h1><p>Toque em uma opção no menu abaixo.</p>';console.error(err)}

/* Delegação explícita: nenhum manipulador inline é executado pelo navegador. */
document.addEventListener('click',event=>{
 const el=event.target.closest('[data-action]');
 if(!el)return;
 const action=el.getAttribute('data-action')||'';
 const route=/^go\('([a-z]+)'\)$/.exec(action);
 if(route){go(route[1]);return}
 if(action==='autoFillDemo()'){autoFillDemo();return}
 if(action==='clearDemo()'){clearDemo();return}
 if(action==='clearData()'){clearData();return}
 const reveal=/^toggleCardField\('([a-z]+)'\)$/.exec(action);
 if(reveal){toggleCardField(reveal[1]);return}
 const copy=/^copyCardField\('([a-z]+)'\)$/.exec(action);
 if(copy){copyCardField(copy[1]);return}
});
document.addEventListener('submit',event=>{
 const action=event.target.getAttribute('data-submit');
 if(action==='finishDemo(event)')finishDemo(event);
 if(action==='saveData(event)')saveData(event);
 if(action==='saveProfessional(event)')saveProfessional(event);
});
