/* Static coverage + isolated JSDOM contract tests. No Google requests are sent. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const id = 'G-C0YHGXH33P';
const code = fs.readFileSync(path.join(root, 'assets/js/site-analytics.js'), 'utf8');
const sitemap = new JSDOM(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), { contentType: 'text/xml' });
const rows = [];
const exclusions = {
  '/freelancer-admin/': 'redirect to an already tracked product page',
  '/freelancer-admin/receipt/': 'pre-existing missing/retired source; no visitor document to instrument',
  '/signalpost/': 'separate authenticated publishing app and privacy scope',
  '/signalpost/privacy/': 'SignalPost app scope',
  '/signalpost/terms/': 'SignalPost app scope',
  '/signalpost/support/': 'SignalPost app scope'
};
for (const loc of sitemap.window.document.querySelectorAll('loc')) {
  const url = new URL(loc.textContent);
  const relative = url.pathname.slice(1) + (url.pathname.endsWith('/') ? 'index.html' : '');
  if (exclusions[url.pathname]) { rows.push({ route: url.pathname, excluded: exclusions[url.pathname] }); continue; }
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  const dom = new JSDOM(html, { url: url.href });
  const scripts = [...dom.window.document.scripts];
  const direct = scripts.filter(s => s.src.includes('googletagmanager.com/gtag/js?id=' + id));
  const shared = scripts.filter(s => new URL(s.src || url.href).pathname === '/assets/js/site-analytics.js');
  assert.equal(direct.length + shared.length, 1, `${url.pathname}: exactly one analytics entry point`);
  assert.equal(shared.length ? shared[0].defer : true, true);
  rows.push({ route: url.pathname, mode: shared.length ? 'shared' : 'existing' });
  dom.window.close();
}
sitemap.window.close();
function make(url, html = '<!doctype html><html><head></head><body></body></html>') {
  return new JSDOM(html, { url, referrer: 'https://referrer.example/path?private=secret#token', runScripts: 'outside-only' });
}
const live = make('https://michaelcostea.com/omi-magnetic-clip/?private=secret#token');
live.window.eval(code); live.window.eval(code);
const configs = live.window.dataLayer.filter(x => x[0] === 'config');
assert.equal(configs.length, 1, 'duplicate inclusion must not double count');
assert.equal(configs[0][1], id);
assert.equal(configs[0][2].allow_google_signals, false);
assert.equal(configs[0][2].allow_ad_personalization_signals, false);
assert.equal(configs[0][2].page_location, 'https://michaelcostea.com/omi-magnetic-clip/');
assert.equal(configs[0][2].page_referrer, 'https://referrer.example/path');
assert.equal(live.window.document.querySelectorAll('script[src*="googletagmanager.com"]').length, 1);
live.window.close();
for (const host of ['http://127.0.0.1:8806', 'http://localhost:8806', 'https://example.com', 'https://michaelcostea.com.attacker.example']) {
  const dom = make(host); dom.window.eval(code);
  assert.equal(dom.window.dataLayer, undefined, `do not count ${host}`); dom.window.close();
}
const existing = make('https://michaelcostea.com/', `<script src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`);
existing.window.eval(code);
assert.equal(existing.window.dataLayer, undefined, 'respect existing inline configuration'); existing.window.close();
const embedded = make('https://michaelcostea.com/', '<!doctype html><iframe></iframe>');
const frame = embedded.window.document.querySelector('iframe').contentWindow;
frame.eval(code); assert.equal(frame.dataLayer, undefined, 'embedded pages do not count'); embedded.window.close();
for (const callback of ['threads/callback/index.html', 'tiktok/callback/index.html']) {
  const html = fs.readFileSync(path.join(root, callback), 'utf8');
  assert(!/site-analytics|googletagmanager|gtag\(/.test(html), `${callback} must remain untracked`);
}
console.log(JSON.stringify({ passed: true, sitemapEntries: rows.length, covered: rows.filter(r => r.mode).length, newlyCovered: rows.filter(r => r.mode === 'shared').length, exclusions: rows.filter(r => r.excluded), contractChecks: ['single initialization', 'one loader', 'privacy flags', 'clean URLs', 'production host only', 'existing tag preserved', 'iframe excluded', 'OAuth callbacks excluded'] }, null, 2));
