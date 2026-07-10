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
  'Open live RebateSignal',
  'remain withheld',
]) {
  must(copy.includes(expected), `RebateSignal window missing ${expected}`);
}

const firebaseUrl = 'https://rebatesignal-staging.web.app';
const liveLink = document.querySelector(`#vicRebateApiWindow a[href="${firebaseUrl}"]`);
must(liveLink, 'project window should link to the latest Firebase RebateSignal deployment');
must(liveLink.getAttribute('target') === '_blank', 'Firebase RebateSignal link should open separately');
must(html.includes('public_quote_ready=true'), 'project window should expose guarded public quote readiness');
must(html.includes('42,012 source-backed approved products'), 'project window should expose current promoted catalog count');

const projectCardCopy = text('#projectsWindow');
must(projectCardCopy.includes('RebateSignal'), 'Projects window should include RebateSignal card');
must(projectCardCopy.includes('source-backed hot-water VEECs'), 'Projects card should describe current source-backed hot-water VEEC quoting');
must(copy.includes('POST /api/v1/quotes'), 'project window should expose the Firebase Hosting API route');
must(copy.includes('hot-water STCs'), 'project window should distinguish the still-guarded hot-water STC line');

const draftDom = new JSDOM(draft);
const draftDoc = draftDom.window.document;
must(draftDoc.title.includes('RebateSignal'), 'redirect page title should name RebateSignal');
must(draftDoc.querySelector('meta[name="robots"]')?.getAttribute('content').includes('noindex'), 'redirect page should remain noindex');
must(draftDoc.querySelector('link[rel="canonical"]')?.getAttribute('href') === firebaseUrl, 'redirect page canonical should be Firebase deployment');
must(draftDoc.querySelector('meta[http-equiv="refresh"]')?.getAttribute('content') === `0;url=${firebaseUrl}`, 'redirect page should immediately point to Firebase deployment');
const draftText = draftDoc.body.textContent.replace(/\s+/g, ' ');
must(draftText.includes('Opening RebateSignal'), 'redirect fallback should clearly identify RebateSignal');
must(draftText.includes('latest guarded public quote deployment'), 'redirect fallback should explain the target');
must(draft.includes(`window.location.replace('${firebaseUrl}')`), 'redirect page should use location.replace as JavaScript fallback');
must(!draft.includes('function calculateQuote'), 'stale local sample calculator must not remain on redirect page');

console.log('rebatesignal-project-regression ok');
