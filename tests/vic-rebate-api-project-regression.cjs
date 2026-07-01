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

must(html.includes('data-open="vicRebateApiWindow"'), 'missing launcher/nav opener for RebateSignal window');
must(html.includes('href="#vic-rebate-api"'), 'missing direct #vic-rebate-api page link');
must(script.includes("vicRebateApiWindow: 'vic-rebate-api'"), 'missing RebateSignal route mapping');
must(script.includes("'rebate-api': 'vic-rebate-api'"), 'missing rebate-api route alias');
must(script.includes("rebatesignal: 'vic-rebate-api'"), 'missing RebateSignal route alias');
must(script.includes("'rebate-signal': 'vic-rebate-api'"), 'missing RebateSignal dashed route alias');

const win = document.querySelector('#vicRebateApiWindow');
must(win, 'missing #vicRebateApiWindow section');
must(win.getAttribute('aria-label') === 'RebateSignal project', 'RebateSignal window should have clear aria-label');
const copy = text('#vicRebateApiWindow');
for (const expected of [
  'RebateSignal',
  'VEU / VEEC',
  'STC',
  'Solar Victoria',
  'decommissioning evidence',
  'rules engine',
  'payout range',
  'Open RebateSignal tester',
  'sample_logic',
]) {
  must(copy.includes(expected), `RebateSignal window missing ${expected}`);
}

const liveLink = document.querySelector('#vicRebateApiWindow a[href="vic-rebate-api.html"]');
must(liveLink, 'project window should link to vic-rebate-api.html RebateSignal tester');

const projectCardCopy = text('#projectsWindow');
must(projectCardCopy.includes('RebateSignal'), 'Projects window should include RebateSignal card');
must(projectCardCopy.includes('VEU/VEEC, STC, and Solar Victoria'), 'Projects card should name the scheme coverage');

const draftDom = new JSDOM(draft);
const draftDoc = draftDom.window.document;
must(draftDoc.title.includes('RebateSignal'), 'draft page title should name RebateSignal');
must(draftDoc.querySelector('meta[name="robots"]')?.getAttribute('content').includes('noindex'), 'draft page should be noindex while in draft');
const draftText = draftDoc.body.textContent.replace(/\s+/g, ' ');
for (const expected of [
  'API service draft',
  'Always-current rebate payout API',
  'Latest payout feed',
  'Example API payloads',
  'GET /v1/payouts/latest',
  'POST /v1/quotes',
  'Heat pump hot water',
  'VEU / VEEC estimate',
  'STC estimate',
  'Solar Victoria',
  'sample logic only',
  'stale values are visible',
  'Accuracy safeguards',
  'decommissioning evidence',
]) {
  must(draftText.includes(expected), `draft page missing ${expected}`);
}
must(draft.includes('function calculateQuote'), 'RebateSignal tester should include client-side quote calculator');
must(draft.includes('decommissioned'), 'RebateSignal tester should model decommissioning state');
must(draft.includes('latest_verified'), 'draft page should show latest payout strategy in request payload');
must(draft.includes('stale_after_minutes'), 'draft page should explain stale payout freshness');

console.log('rebatesignal-project-regression ok');
