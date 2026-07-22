#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const base = (process.env.PAGE_URL || 'http://127.0.0.1:4188').replace(/\/$/, '');
const outDir = process.env.QA_OUT || '/tmp/michael-project-details-qa';
fs.mkdirSync(outDir, { recursive: true });

async function inspect(browser, label, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.route('https://www.google-analytics.com/**', route => route.fulfill({ status: 204, body: '' }));
  await page.route('https://www.google.com/g/collect**', route => route.fulfill({ status: 204, body: '' }));
  const errors = [];
  page.on('pageerror', err => errors.push(`pageerror:${err.message}`));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`console:${msg.text()}`); });
  const response = await page.goto(`${base}/#projects`, { waitUntil: 'networkidle', timeout: 45_000 });
  await page.waitForTimeout(500);

  const checks = await page.evaluate(() => {
    const win = document.querySelector('#projectsWindow');
    const body = win?.querySelector('.win-body');
    const cards = [...document.querySelectorAll('#projectsWindow .project-showcase-grid > .project-showcase-card')];
    const rect = win?.getBoundingClientRect();
    return {
      statusOpen: win?.classList.contains('open'),
      cardCount: cards.length,
      titles: cards.map(card => card.querySelector('h3')?.textContent.trim()),
      metaCount: cards.filter(card => card.querySelector('.project-meta')).length,
      scopeCount: cards.filter(card => card.querySelector('.project-scope')?.textContent.includes('Delivery scope:')).length,
      stackCount: cards.filter(card => card.querySelector('.project-stack')?.textContent.includes('Tech stack:')).length,
      stackLengths: cards.map(card => card.querySelector('.project-stack')?.textContent.trim().length || 0),
      pageScrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      winLeft: rect?.left,
      winRight: rect?.right,
      winWidth: rect?.width,
      bodyClientWidth: body?.clientWidth,
      bodyScrollWidth: body?.scrollWidth,
      bodyClientHeight: body?.clientHeight,
      bodyScrollHeight: body?.scrollHeight,
      stylesHref: document.querySelector('link[href*="styles.css"]')?.getAttribute('href'),
      brokenImages: [...document.images].filter(img => img.complete && img.naturalWidth === 0).map(img => img.src),
    };
  });

  if (response?.status() !== 200) throw new Error(`${label} HTTP ${response?.status()}`);
  if (!checks.statusOpen) throw new Error(`${label} projects window did not open`);
  if (checks.cardCount !== 13) throw new Error(`${label} expected 13 project cards, got ${checks.cardCount}`);
  if (checks.titles.includes('Tiny Menace')) throw new Error(`${label} Tiny Menace still visible`);
  if (checks.metaCount !== 13 || checks.scopeCount !== 13 || checks.stackCount !== 13) throw new Error(`${label} project detail/stack coverage incomplete`);
  if (checks.stackLengths.some(length => length < 55)) throw new Error(`${label} one or more tech stacks are too thin`);
  if (checks.pageScrollWidth > checks.innerWidth + 1) throw new Error(`${label} horizontal page overflow`);
  if ((checks.winLeft ?? -1) < -1 || (checks.winRight ?? Infinity) > checks.innerWidth + 1) throw new Error(`${label} project window outside viewport`);
  if ((checks.bodyScrollWidth ?? Infinity) > (checks.bodyClientWidth ?? 0) + 1) throw new Error(`${label} project body horizontal overflow`);
  if (!checks.stylesHref?.includes('20260723-project-tech-stacks')) throw new Error(`${label} project CSS cache marker stale`);
  if (checks.brokenImages.length) throw new Error(`${label} broken images: ${checks.brokenImages.join(', ')}`);
  if (errors.length) throw new Error(`${label} browser errors: ${errors.join(' | ')}`);

  await page.screenshot({ path: path.join(outDir, `${label}-projects-top.png`), fullPage: true });
  await page.evaluate(() => { const body = document.querySelector('#projectsWindow .win-body'); if (body) body.scrollTop = body.scrollHeight / 2; });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, `${label}-projects-middle.png`), fullPage: true });
  await page.evaluate(() => { const body = document.querySelector('#projectsWindow .win-body'); if (body) body.scrollTop = body.scrollHeight; });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, `${label}-projects-bottom.png`), fullPage: true });
  await page.close();
  return { label, status: response.status(), ...checks };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    results.push(await inspect(browser, 'desktop', 1440, 1100));
    results.push(await inspect(browser, 'mobile', 390, 844));
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify({ base, results }, null, 2));
})().catch(err => { console.error(err); process.exit(1); });
