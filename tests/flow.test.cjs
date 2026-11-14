const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const script = file => readFileSync(path.join(__dirname, '..', file), 'utf8');
const origin = 'http://localhost:8174';

function scanner() {
  const emitted = [];
  const input = { type:'email', value:'', name:'email', id:'', autocomplete:'email', form:{}, isConnected:true,
    getClientRects:()=>[{}], getAttribute:()=>null, matches:()=>false, closest:()=>null, validity:{valid:true},
    dispatchEvent:e=>emitted.push(e.type) };
  const context = { crypto:webcrypto, Event, Date, location:{origin,href:origin+'/'}, document:{querySelectorAll:()=>[input],getElementById:()=>null},
    getComputedStyle:()=>({visibility:'visible', opacity:'1',display:'block'}), labConfig:{target:origin} };
  context.window = context; context.top = context;
  vm.createContext(context);
  vm.runInContext(script('extension/classifier.js'), context);
  vm.runInContext(script('extension/scanner.js'), context);
  return {input, context, review:context.preenchoReview, emitted};
}
test('aplica uma seleção uma vez e emite apenas input/change', () => {
  const {review,context,input,emitted} = scanner();
  assert.equal(review.preview.fields.length,1);
  assert.equal(review.apply(review.preview.ticket,{0:'demo@example.invalid'}),1);
  assert.equal(input.value,'demo@example.invalid');
  assert.deepEqual(emitted,['input','change']);
  assert.equal(context.preenchoReview,undefined);
});
for (const [name,change] of [
  ['ocupado',s=>s.input.value='já editado'],['desconectado',s=>s.input.isConnected=false],
  ['invisível',s=>s.input.getClientRects=()=>[]],['renomeado',s=>s.input.id='outro'],
  ['outro formulário',s=>s.input.form={}],['inválido',s=>s.input.validity.valid=false],
  ['limite de tamanho',s=>s.input.maxLength=3],
]) test('ignora campo '+name, () => {
  const s=scanner(); change(s);
  assert.equal(s.review.apply(s.review.preview.ticket,{0:'demo@example.invalid'}),0);
  assert.deepEqual(s.emitted,[]);
  assert.equal(s.input.value,name==='ocupado'?'já editado':'');
});
test('navegação, ticket divergente e expiração não autorizam escrita', () => {
  for(const mode of ['url','ticket','timeout']) {
    const s=scanner(); let token=s.review.preview.ticket;
    if(mode==='url') s.context.location.href+='#mudou';
    if(mode==='ticket') token='outra operação';
    if(mode==='timeout') s.context.Date={now:()=>Date.now()+181000};
    assert.equal(s.review.apply(token,{0:'demo@example.invalid'}),null);
    assert.equal(s.input.value,'');
  }
});
function approval(identity) {
  const nodes=[], handlers={}, sent=[];
  const peer={closed:false,postMessage:(data,to)=>sent.push({data,to})};
  const config={target:origin,vault:'http://localhost:8173',extension:identity || 'chrome-extension://'+'a'.repeat(32)};
  const ctx={ location:{search:'?extension-approval',origin:config.vault}, opener:peer,
    approvalConfig:config, addEventListener:(name,fn)=>handlers[name]=fn, close(){}, setTimeout(){},
    vaultUnlocked:true, DATA_KEY:'p',PROFILE_KEY:'b',
    vaultGet:k=>JSON.stringify(k==='p'?{email:'p@example.invalid',cpf:'000',name:'Pessoa Teste'}:{businessEmail:'b@example.invalid'}),
    document:{createElement:()=>{const node={append(){},showModal(){},close(){}}; nodes.push(node); return node;},body:{append(){}}}};
  ctx.window=ctx;ctx.top=ctx;
  vm.runInNewContext(script('lab/approval.js'),ctx);
  const req={type:'review',origin,ticket:webcrypto.randomUUID(),profile:'professional',kinds:['email']};
  return {ctx, sent, button:nodes[3], handlers, req, send:(data=req,source=peer,from=config.extension)=>handlers.message({data,source,origin:from})};
}
test('o cofre libera apenas o campo autorizado do perfil profissional após clique', () => {
  const s=approval();s.send();
  assert.deepEqual(s.sent.map(x=>x.data.type),['ready']);
  s.button.onclick({isTrusted:true});
  assert.deepEqual(JSON.parse(JSON.stringify(s.sent[1].data.values)),{email:'b@example.invalid'});
  assert.equal(s.sent[1].to,s.ctx.approvalConfig.extension);
  s.button.onclick({isTrusted:true});
  assert.equal(s.sent.length,2);
});
for (const mode of ['outra origem','outra janela','outro destino','campo proibido','cofre bloqueado','clique sintético']) {
  test('cofre recusa '+mode, () => {
    const s=approval();
    if(mode==='outro destino') s.req.origin='https://example.invalid';
    if(mode==='campo proibido') s.req.kinds=['password'];
    s.send(s.req,mode==='outra janela'?{}:undefined,mode==='outra origem'?origin:undefined);
    if(mode==='cofre bloqueado') s.ctx.vaultUnlocked=false;
    s.button.onclick({isTrusted:mode!=='clique sintético'});
    assert.equal(s.sent.length,1);
  });
}
test('referência antiga ao scanner não reutiliza aprovação consumida', () => {
  const s=scanner(), token=s.review.preview.ticket;
  assert.equal(s.review.apply(token,{0:'demo@example.invalid'}),1);
  s.input.value='';
  assert.equal(s.review.apply(token,{0:'demo@example.invalid'}),null);
  assert.equal(s.input.value,'');
});
test('mensagem duplicada não altera campos ou perfil já em revisão', () => {
  const s=approval();
  s.send(); s.send({...s.req,profile:'personal',kinds:['cpf']});
  s.button.onclick({isTrusted:true});
  assert.deepEqual(JSON.parse(JSON.stringify(s.sent[1].data.values)),{email:'b@example.invalid'});
});
test('cofre recusa autorização fora do prazo mesmo com timer suspenso', () => {
  const s=approval();
  s.send(); s.ctx.Date={now:()=>Date.now()+200000}; s.button.onclick({isTrusted:true});
  assert.equal(s.sent.length,1);
});

test('cofre sem pareamento permanece inativo', () => {
  const s = approval('safari-web-extension://unpaired');
  assert.equal(s.sent.length, 0);
  assert.equal(s.handlers.message, undefined);
  assert.equal(s.button, undefined);
});
