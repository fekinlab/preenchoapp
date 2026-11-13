'use strict';
const form=document.getElementById('registration'),status=document.getElementById('status');
form.addEventListener('submit',e=>{e.preventDefault();status.textContent='Teste concluído! Nenhum dado foi enviado.'});
form.addEventListener('reset',()=>{status.textContent='Campos limpos.'});
if(new URLSearchParams(location.search).get('preencho')==='1'){
 const origin=location.origin;
 window.addEventListener('message',event=>{
  if(event.origin!==origin||event.source!==window.opener||event.data?.type!=='PREENCHO_TEST_FILL')return;
  const data=event.data.values;
  if(!data||typeof data!=='object'||Array.isArray(data))return;
  let count=0;
  for(const input of form.querySelectorAll('input[name]')){
   const value=data[input.name];
   if(typeof value==='string'&&value.trim()){input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));count++}
  }
  status.textContent=count+' campos preenchidos pelo Preenchô. Revise antes de concluir. Nenhum dado foi enviado.';
 },{once:true});
 if(window.opener){window.opener.postMessage({type:'PREENCHO_TEST_READY'},origin)}
 else status.textContent='Abra este formulário pelo botão do Preenchô para testar o preenchimento automático.';
}
