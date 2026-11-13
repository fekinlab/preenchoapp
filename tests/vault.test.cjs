const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {readFileSync} = require('node:fs');
const {webcrypto} = require('node:crypto');
const path = require('node:path');
test('cofre v57: derivação, persistência cifrada e validação de senha e integridade', async () => {
  const records = new Map();
  const ctx = vm.createContext({crypto:webcrypto,TextEncoder,TextDecoder,atob,btoa,
    localStorage:{getItem:k=>records.get(k),setItem:(k,v)=>records.set(k,v)},
    document:{getElementById:()=>({addEventListener(){},querySelectorAll:()=>[],classList:{toggle(){}}}),
      addEventListener(){},querySelectorAll:()=>[]}, window:{scrollTo(){},addEventListener(){}}, setTimeout(){},setInterval(){},console});
  vm.runInContext(readFileSync(path.join(__dirname,'../app.js'),'utf8'),ctx);
  const pass = webcrypto.randomUUID();
  ctx.testPassword = pass;
  await vm.runInContext(`(async()=>{
    const salt=crypto.getRandomValues(new Uint8Array(16));
    vaultKey=await deriveVaultKey(testPassword,salt);vaultUnlocked=true;
    localStorage.setItem(VAULT_KEY,JSON.stringify({salt:b64(salt),version:1}));
    await vaultSet(DATA_KEY,JSON.stringify({name:'Teste Sintético'}));
  })()`,ctx);
  const sealed = records.get('preencho_vault_v1');
  assert.ok(!sealed.includes('Sintético') && !sealed.includes(pass));
  const record = JSON.parse(sealed);
  const bytes=s=>Buffer.from(s,'base64');
  const key = await vm.runInContext('deriveVaultKey(testPassword,unb64(JSON.parse(localStorage.getItem(VAULT_KEY)).salt))',ctx);
  assert.equal(key.extractable,false);
  const decrypt = (key,ciphertext) => webcrypto.subtle.decrypt({name:'AES-GCM',iv:bytes(record.iv)},key,ciphertext);
  const contents = JSON.parse(new TextDecoder().decode(await decrypt(key,bytes(record.ciphertext))));
  assert.equal(JSON.parse(contents.preencho_demo_data_v1).name,'Teste Sintético');
  const wrong = await vm.runInContext('deriveVaultKey("senha-diferente",unb64(JSON.parse(localStorage.getItem(VAULT_KEY)).salt))',ctx);
  await assert.rejects(decrypt(wrong,bytes(record.ciphertext)),{name:'OperationError'});
  const altered = bytes(record.ciphertext); altered[0]^=1;
  await assert.rejects(decrypt(key,altered),{name:'OperationError'});
  assert.equal(records.get('preencho_vault_v1'),sealed);
});
