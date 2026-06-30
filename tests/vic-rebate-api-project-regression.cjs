#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(rootDir, 'script.js'), 'utf8');
const draft = fs.readFileSync(path.join(rootDir, 'vic-rebate-api.html'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;

function must(condition, message) {
  if (!condition) throw new Error(message);
}
function text(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`missing ${selector}`);
  return el.textContent.replace(/\s+/g, ' ').trim();
}

must(html.includes('data-open="vicRebateApiWindow"'), 'missing launcher/nav opener for Victoria Rebate API window');
must(html.includes('href="#vic-rebate-api"'), 'missing direct #vic-rebate-api page link');
must(script.includes("vicRebateApiWindow: 'vic-rebate-api'"), 'missing Victoria Rebate API route mapping');
must(script.includes("'rebate-api': 'vic-rebate-api'"), 'missing rebate-api route alias');

const win = document.querySelector('#vicRebateApiWindow');
must(win, 'missing #vicRebateApiWindow section');
must(win.getAttribute('aria-label') === 'Victoria Rebate API project', 'Victoria Rebate API window should have clear aria-label');
const copy = text('#vicRebateApiWindow');
for (const expected of [
  'Victoria Rebate API',
  'VEU / VEEC',
  'STC',
  'Solar Victoria',
  'decommissioning evidence',
  'rules engine',
  'payout range',
  'Open live draft tester',
  'sample_logic',
]) {
  must(copy.includes(expected), `Victoria Rebate API window missing ${expected}`);
}

const liveLink = document.querySelector('#vicRebateApiWindow a[href="vic-rebate-api.html"]');
must(liveLink, 'project window should link to vic-rebate-api.html draft tester');

const projectCardCopy = text('#projectsWindow');
must(projectCardCopy.includes('Victoria Rebate API'), 'Projects window should include Victoria Rebate API card');
must(projectCardCopy.includes('VEU/VEEC, STC, and Solar Victoria'), 'Projects card should name the scheme coverage');

const draftDom = new JSDOM(draft);
const draftDoc = draftDom.window.document;
must(draftDoc.title.includes('Victoria Rebate API'), 'draft page title should name project');
must(draftDoc.querySelector('meta[name="robots"]')?.getAttribute('content').includes('noindex'), 'draft page should be noindex while in draft');
const draftText = draftDoc.body.textContent.replace(/\s+/g, ' ');
for (const expected of [
  'Live draft tester',
  'Heat pump hot water',
  'VEU / VEEC estimate',
  'STC estimate',
  'Solar Victoria',
  'sample logic only',
  'POST /v1/quotes',
]) {
  must(draftText.includes(expected), `draft page missing ${expected}`);
}
must(draft.includes('function calculateQuote'), 'draft tester should include client-side quote calculator');
must(draft.includes('decommissioned'), 'draft tester should model decommissioning state');

console.log('vic-rebate-api-project-regression ok');
