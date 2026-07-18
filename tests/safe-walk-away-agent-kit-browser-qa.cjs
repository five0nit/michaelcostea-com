#!/usr/bin/env node
const path = require('path');
const { chromium } = require('/home/fiv30nit/.openclaw/workspace/node_modules/playwright');

const url = process.env.PAGE_URL || 'http://127.0.0.1:4187/safe-walk-away-agent-kit.html';
const out = process.env.QA_OUT || '/home/fiv30nit/.hermes/profiles/generalist1/autonomy/missions/20260717T230057Z-find-the-easier-way-for-us-to-auto-gen-e0ab62e2/artifacts/launch-assets';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/snap/bin/chromium' });
  for (const [name, viewport] of Object.entries({ desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 } })) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(String(err)));
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    if (!response || !response.ok()) throw new Error(`${name}: bad response`);
    const metrics = await page.evaluate(() => ({
      title: document.title,
      status: document.body.dataset.launchStatus,
      h1: document.querySelector('h1')?.textContent?.trim(),
      cta: document.querySelector('.primary-cta')?.textContent?.trim(),
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    if (metrics.overflow) throw new Error(`${name}: horizontal overflow ${metrics.scrollWidth}>${metrics.width}`);
    if (metrics.status !== 'live') throw new Error(`${name}: wrong status`);
    if (!metrics.h1 || !metrics.cta) throw new Error(`${name}: hero missing`);
    if (errors.length) throw new Error(`${name}: console errors ${errors.join(' | ')}`);
    await page.screenshot({ path: path.join(out, `safe-walk-away-agent-kit-${name}.png`), fullPage: true });
    console.log(JSON.stringify({ viewport: name, ...metrics, consoleErrors: 0 }));
    await page.close();
  }
  await browser.close();
})().catch(err => { console.error(err.stack || err); process.exit(1); });
