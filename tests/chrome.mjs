import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import puppeteer from 'puppeteer';
const [vault, target, path, origin] = process.argv.slice(2);
const browser = await puppeteer.launch({ enableExtensions:true, headless:true, args:['--no-sandbox'] });
try {
  const id = await browser.installExtension(path);
  assert.equal('chrome-extension://'+id,origin);
  const extension = (await browser.extensions()).get(id);
  const page = await browser.newPage();
  await page.goto(vault);
  const ready = p => p.waitForFunction(()=>getComputedStyle(document.querySelector('#splash')).visibility==='hidden' || !document.querySelector('#splash').getClientRects().length);
  await ready(page);
  const password = randomUUID();
  await page.type('#vault-pass',password);
  await page.type('#vault-confirm',password);
  await page.locator('#vault-submit').click();
  await page.waitForSelector('#vault-gate[hidden]');
  await page.locator('[data-page=data]').click();
  await page.type('#data-form [name=name]','Pessoa Teste');
  await page.type('#data-form [name=email]','demo@example.invalid');
  await page.locator('#data-form button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#save-status')?.textContent.includes('salvos'));
  await page.goto(target);
  async function getPage(prefix,trigger) {
    const waiting = browser.waitForTarget(t=>t.url().startsWith(prefix),{timeout:12000});
    await trigger();
    return (await waiting).asPage();
  }
  async function review() {
    await page.bringToFront();
    const popup = await getPage(origin+'/popup.html',()=>page.triggerExtensionAction(extension));
    const r = await getPage(origin+'/review.html',()=>popup.locator('#scan').click());
    await r.waitForSelector('#fields input',{timeout:12000});
    assert.equal(await r.$eval('#origin',el=>el.textContent),target);
    return r;
  }
  let r=await review();
  assert.equal((await r.$$('input:checked')).length,0);
  await r.locator('#cancel').click();
  assert.equal(await page.$eval('[autocomplete=name]',el=>el.value),'');
  await r.close();
  r=await review();
  await r.locator('#fields label:first-child input').click();
  const consent=await getPage(vault+'/?extension-approval',()=>r.locator('#authorize').click());
  await ready(consent);
  await consent.type('#vault-pass',password);
  await consent.locator('#vault-submit').click();
  await consent.locator('dialog[open] button:first-of-type').click();
  await r.locator('#apply').click();
  await r.waitForFunction(()=>document.querySelector('#status').textContent.includes('1 de 1'));
  assert.equal(await page.$eval('[autocomplete=name]',el=>el.value),'Pessoa Teste');
  assert.equal(await page.$eval('[type=email]',el=>el.value),'');
  assert.equal(new URL(page.url()).origin,target);
  console.log(await browser.version(),'OK: autorização, cancelamento e preenchimento seletivo.');
} finally { await browser.close(); }
