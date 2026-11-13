'use strict';
const out=document.getElementById('status'),list=document.getElementById('fields'),preview=document.getElementById('preview'),confirmation=document.getElementById('confirmation');
const known={name:'Nome completo',email:'E-mail',phone:'Telefone',birth:'Data de nascimento',cpf:'CPF',rg:'RG',zip:'CEP',street:'Rua / Avenida',number:'Número',city:'Cidade',state:'Estado',company:'Empresa',role:'Cargo',cnpj:'CNPJ'};
function classify(f){
 const a=(f.autocomplete||'').toLowerCase().split(/\s+/);
 const ac={'name':'name','given-name':'name','family-name':'name','email':'email','tel':'phone','bday':'birth','postal-code':'zip','street-address':'street','address-line1':'street','address-level2':'city','address-level1':'state','organization':'company','organization-title':'role'};
 for(const token of a)if(ac[token])return ac[token];
 const raw=[f.name,f.id,f.label,f.placeholder].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/([a-z])([A-Z])/g,'$1 $2');
 const rules=[['cnpj',/\bcnpj\b/],['cpf',/\bcpf\b/],['rg',/\brg\b|identidade/],['birth',/nascimento|birth|birthday|data nasc/],['zip',/\bcep\b|postal|zip/],['email',/e.?mail/],['phone',/telefone|celular|whatsapp|\bphone\b|\btel\b/],['street',/endereco|logradouro|rua|avenida|street|address/],['number',/numero|number|\bnro\b/],['city',/cidade|\bcity\b/],['state',/estado|\buf\b|\bstate\b/],['company',/empresa|company|organizacao|razao social/],['role',/cargo|profissao|occupation|job title/],['name',/nome|\bname\b/]];
 for(const [key,re] of rules)if(re.test(raw))return key;
 if(f.type==='email')return 'email';
 if(f.type==='tel')return 'phone';
 return null;
}
document.getElementById('scan').addEventListener('click',async()=>{
 out.textContent='Analisando campos…';list.replaceChildren();preview.disabled=true;confirmation.textContent='';
 try{
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.id)throw Error('Nenhuma aba disponível.');
  const result=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>{
   const els=[...document.querySelectorAll('input,select,textarea')];
   return els.filter(el=>!el.disabled&&!el.readOnly&&!['hidden','password','file','submit','button','reset','checkbox','radio'].includes(el.type)).slice(0,100).map(el=>{
    const id=el.id||'',lab=el.labels?.[0]?.textContent||'';
    return {tag:el.tagName.toLowerCase(),type:(el.type||'').slice(0,40),name:(el.getAttribute('name')||'').slice(0,100),id:id.slice(0,100),autocomplete:(el.getAttribute('autocomplete')||'').slice(0,100),label:lab.trim().slice(0,100),placeholder:(el.getAttribute('placeholder')||'').slice(0,100)};
   });
  }});
  const fields=result?.[0]?.result||[],matches=fields.map((f,i)=>({...f,index:i,kind:classify(f)})).filter(f=>f.kind);
  out.textContent=fields.length+' campos encontrados; '+matches.length+' reconhecidos. Revise a seleção abaixo.';
  if(!matches.length){out.textContent+=' Nenhum campo conhecido foi identificado.';return}
  for(const f of matches){
   const row=document.createElement('label');row.className='item';
   const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.value=String(f.index);checkbox.checked=true;
   const content=document.createElement('span');const title=document.createElement('span');title.className='kind';title.textContent=known[f.kind];
   const meta=document.createElement('div');meta.className='meta';meta.textContent=(f.label||f.name||f.id||'Campo sem nome')+' · '+f.type;
   content.append(title,meta);row.append(checkbox,content);list.append(row);
  }
  preview.disabled=false;
 }catch(e){out.textContent='Não foi possível analisar esta aba. '+(e?.message||'');}
});
preview.addEventListener('click',()=>{
 const selected=[...list.querySelectorAll('input:checked')].map(el=>el.parentElement.querySelector('.kind')?.textContent||'');
 confirmation.textContent=selected.length?'Prévia autorizada para '+selected.length+' campos: '+selected.join(', ')+'. Nenhum dado foi acessado ou preenchido.':'Nenhum campo selecionado. Nada será feito.';
});