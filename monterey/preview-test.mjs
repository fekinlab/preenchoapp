import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const browser=await puppeteer.launch({args:['--no-sandbox']});
try {
 const p=await browser.newPage();
 await p.goto(pathToFileURL(resolve('entrega/ABRIR NO SAFARI.html')).href);
 await p.click('#cancel'); assert.equal(await p.$eval('#nome',e=>e.value),'');
 await p.reload();await p.click('#choices input');await p.click('#review');
 assert.equal(await p.$eval('#nome',e=>e.value),'');
 await p.click('#apply');
 assert.equal(await p.$eval('#nome',e=>e.value),'Pessoa Teste');
 assert.equal(await p.$eval('#email',e=>e.value),'');
} finally { await browser.close(); }
