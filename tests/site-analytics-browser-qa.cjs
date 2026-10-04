#!/usr/bin/env node
/* Local browser verification: serve local files at the production origin;
 * stub only analytics endpoints so QA never adds fake visitors. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const local = process.env.BASE_URL || 'http://127.0.0.1:18127';
const out = process.env.QA_DIR || '/tmp/site-analytics-browser-qa';
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const sitemap = new JSDOM(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), { contentType: 'text/xml' });
  const routes = [...sitemap.window.document.querySelectorAll('loc')].map(n => new URL(n.textContent)).filter(url => {
    const file = path.join(root, url.pathname.slice(1) + (url.pathname.endsWith('/') ? 'index.html' : ''));
    return fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes('/assets/js/site-analytics.js?');
  });
  sitemap.window.close();
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await context.route('https://michaelcostea.com/**', async route => {
      const url = new URL(route.request().url());
      const response = await route.fetch({ url: local + url.pathname + url.search });
      await route.fulfill({ response });
    });
    await context.route(/https:\/\/[^/]*(googletagmanager\.com|google-analytics\.com)\//, route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    for (const url of routes) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const response = await page.goto(url.href, { waitUntil: 'domcontentloaded' });
      assert.equal(response.status(), 200, url.pathname);
      await page.waitForFunction(() => window.dataLayer?.some(item => item[0] === 'config'));
      const state = await page.evaluate(() => ({
        configs: window.dataLayer.filter(x => x[0] === 'config').map(x => ({ id: x[1], options: x[2] })),
        loaders: [...document.scripts].filter(s => s.src.includes('googletagmanager.com/gtag/js')).length,
        title: document.title,
        width: innerWidth,
        documentWidth: document.documentElement.scrollWidth
      }));
      assert.equal(state.configs.length, 1, url.pathname + ': duplicate config');
      assert.equal(state.configs[0].id, 'G-C0YHGXH33P');
      assert.equal(state.configs[0].options.allow_google_signals, false);
      assert.equal(state.configs[0].options.allow_ad_personalization_signals, false);
      assert.equal(state.configs[0].options.page_location, url.href);
      assert.equal(state.loaders, 1);
      if (['/omi-magnetic-clip/', '/privacy/'].includes(url.pathname)) {
        await page.waitForLoadState('networkidle');
        for (const width of [390, 1440]) {
          await page.setViewportSize({ width, height: 1000 });
          if (url.pathname === '/omi-magnetic-clip/') {
            await page.locator('#v4').scrollIntoViewIfNeeded();
            await page.waitForFunction(() => { const i = document.querySelector('#v4 img'); return i?.complete && i.naturalWidth > 0; });
          }
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
          await page.screenshot({ path: path.join(out, url.pathname.split('/')[1] + '-' + width + '.png') });
        }
      }
      assert.deepEqual(errors, [], url.pathname + ': runtime exceptions');
      results.push({ route: url.pathname, ...state, errors });
      await page.close();
    }
    await context.close();
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ mode: 'local files, analytics endpoints stubbed; not ingestion proof', passed: true, routes: results }, null, 2));
    console.log(JSON.stringify({ passed: true, checked: results.length, mode: 'local browser; Google endpoints stubbed', report: path.join(out, 'report.json') }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
