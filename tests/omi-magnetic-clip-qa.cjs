#!/usr/bin/env node
/* Public clip page: shelf parity, responsive UI, real downloads and hashes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const base = (process.env.BASE_URL || 'http://127.0.0.1:8806').replace(/\/$/, '');
const out = process.env.QA_DIR || '/tmp/omi-clip-public-qa';
const route = '/omi-magnetic-clip/';
const downloads = [
  { name: 'OMI-PLA-REAR-LOADING-v5.zip', sha: 'e2456bb28e25e588b3522bb64a154e67289c29f356f9de09cb06a4c201c44bdd' },
  { name: 'OMI-PLA-FIT-PROTOTYPE-v4.zip', sha: '8cd5900330256d15eca4dd5e1d77e5b1294dae343d4d017933c550d5802fcde3' },
];
function sha(data) { return crypto.createHash('sha256').update(data).digest('hex'); }
async function main() {
  fs.mkdirSync(out, { recursive: true });
  const pageDoc = new JSDOM(fs.readFileSync(path.join(root, route, 'index.html'), 'utf8')).window.document;
  assert.equal(pageDoc.querySelectorAll('h1').length, 1);
  assert.equal(pageDoc.querySelector('link[rel="canonical"]').href, 'https://michaelcostea.com' + route);
  assert.equal(pageDoc.querySelectorAll('a[download]').length, downloads.length);
  for (const item of downloads) {
    const link = pageDoc.querySelector(`a[download="${item.name}"]`);
    assert.ok(link);
    const local = fs.readFileSync(path.join(root, link.getAttribute('href')));
    assert.equal(sha(local), item.sha, `${item.name}: local archive hash`);
    assert.ok(pageDoc.body.textContent.includes(item.sha));
    assert.ok(link.textContent.includes((local.length / 1000000).toFixed(2) + ' MB'));
  }
  let shelfTitles;
  for (const [file, selector] of [['index.html', '#projectsWindow .project-showcase-card'], ['projects/index.html', '.detailed-archive > .project-archive-card']]) {
    const doc = new JSDOM(fs.readFileSync(path.join(root, file), 'utf8')).window.document;
    const cards = [...doc.querySelectorAll(selector)];
    assert.equal(cards.length, 33);
    const titles = cards.map(card => card.querySelector('h3').textContent.trim());
    if (shelfTitles) assert.deepEqual(titles, shelfTitles); else shelfTitles = titles;
    const matching = cards.filter(card => card.dataset.project === 'omi magnetic clip');
    assert.equal(matching.length, 1);
    assert.equal(matching[0].dataset.projectCategory, 'devices');
    assert.ok(matching[0].querySelector('a[href="omi-magnetic-clip/"]'));
  }
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const width of [320, 375, 390, 768, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: width < 800 ? 844 : 1000 }, acceptDownloads: true, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      const response = await page.goto(base + route, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      await page.locator('.clip-hero-image img').evaluate(img => img.decode());
      const geometry = await page.evaluate(() => {
        const doc = document.documentElement;
        const links = [...document.querySelectorAll('a[download]')].map(a => { const r = a.getBoundingClientRect(); return { width: r.width, height: r.height, left: r.left, right: r.right }; });
        return { overflow: doc.scrollWidth - innerWidth, links, brokenImages: [...document.images].filter(img => !img.complete || !img.naturalWidth).map(img => img.src) };
      });
      assert.ok(geometry.overflow <= 1, `${width}: horizontal overflow ${geometry.overflow}`);
      assert.deepEqual(geometry.brokenImages, []);
      for (const link of geometry.links) {
        assert.ok(link.height >= 44 && link.width >= 44, `${width}: download target too small`);
        assert.ok(link.left >= 0 && link.right <= width + 1, `${width}: clipped download`);
      }
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Skip to main content');
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content');
      const menu = page.locator('.menu-button');
      if (await menu.isVisible()) {
        await menu.click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'true');
        await menu.click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'false');
      }
      await page.locator('.clip-integrity summary').click();
      assert.equal(await page.locator('.clip-integrity details').evaluate(el => el.open), true);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1), `${width}: open checksum overflow`);
      await page.locator('.clip-integrity summary').click();
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: path.join(out, `omi-${width}.png`), fullPage: true });
      const downloaded = [];
      if (width === 390 || width === 1440) {
        for (const item of downloads) {
          const [download] = await Promise.all([page.waitForEvent('download'), page.locator(`a[download="${item.name}"]`).click()]);
          assert.equal(await download.failure(), null);
          assert.equal(download.suggestedFilename(), item.name);
          const data = fs.readFileSync(await download.path());
          assert.equal(sha(data), item.sha, `${width}: downloaded ${item.name} hash`);
          downloaded.push({ name: item.name, bytes: data.length, sha256: sha(data) });
        }
      }
      assert.deepEqual(errors, [], `${width}: page errors`);
      results.push({ width, ...geometry, downloaded, errors });
      await context.close();
    }
    // Same-origin assets and destinations, checked through HTTP, not filesystem guesses.
    const request = await browser.newContext();
    const paths = [...new Set([...pageDoc.querySelectorAll('a[href],img[src],link[href],script[src]')].map(el => el.getAttribute('href') || el.getAttribute('src')).filter(url => url.startsWith('/') || url.startsWith('./')))];
    const links = [];
    for (const href of paths) {
      const url = new URL(href, base + route).href;
      const response = await request.request.get(url);
      assert.equal(response.status(), 200, url);
      links.push({ url, status: response.status() });
    }
    for (const shelf of ['/', '/projects/']) {
      const page = await request.newPage();
      await page.goto(base + shelf + (shelf === '/' ? '#projects' : ''), { waitUntil: 'networkidle' });
      const card = page.locator('[data-project="omi magnetic clip"]').first();
      await card.locator('a[href="omi-magnetic-clip/"]').click();
      await page.waitForURL(base + route);
      assert.equal(await page.locator('h1').textContent(), 'Omi magnetic clip.');
      await page.close();
    }
    const report = { base, pass: true, widths: results, localAndLiveLinks: links, shelfNavigation: ['/', '/projects/'] };
    fs.writeFileSync(path.join(out, 'receipt.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
    await request.close();
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exit(1); });
