#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const pageUrl = process.env.PAGE_URL || 'http://127.0.0.1:4173';
const outputDir = process.env.QA_OUT || '/tmp/michael-project-app-store-qa';
fs.mkdirSync(outputDir, { recursive: true });

const cases = [
  { label: 'os-desktop', url: `${pageUrl}/?qa=app-store#projects`, viewport: { width: 1280, height: 900 }, root: '#projectsWindow', card: '.project-showcase-card', columns: 2 },
  { label: 'os-mobile', url: `${pageUrl}/?qa=app-store#projects`, viewport: { width: 390, height: 844 }, root: '#projectsWindow', card: '.project-showcase-card', columns: 1, mobile: true },
  { label: 'page-desktop', url: `${pageUrl}/projects/?qa=app-store`, viewport: { width: 1440, height: 1000 }, root: 'section[data-project-browser]', card: '.project-archive-card', columns: 3 },
  { label: 'page-mobile', url: `${pageUrl}/projects/?qa=app-store`, viewport: { width: 390, height: 844 }, root: 'section[data-project-browser]', card: '.project-archive-card', columns: 1, mobile: true },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const testCase of cases) {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      isMobile: Boolean(testCase.mobile),
      hasTouch: Boolean(testCase.mobile),
    });
    for (const url of ['https://www.googletagmanager.com/**', 'https://www.google-analytics.com/**', 'https://www.google.com/g/collect**']) {
      await context.route(url, (route) => route.fulfill({ status: 204, body: '' }));
    }
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

    const response = await page.goto(testCase.url, { waitUntil: 'networkidle' });
    if (!response || response.status() !== 200) throw new Error(`${testCase.label} failed to load`);
    const root = page.locator(testCase.root);
    const initial = await root.evaluate((element, cardSelector) => {
      const cards = [...element.querySelectorAll(cardSelector)];
      const grid = element.querySelector('.project-showcase-grid, .detailed-archive');
      return {
        visible: cards.filter((card) => !card.hidden).length,
        detailsOpen: cards.filter((card) => card.querySelector('.app-store-details')?.open).length,
        rankRibbons: cards.filter((card) => card.querySelector('.project-rank')).length,
        rankAttributes: cards.filter((card) => card.hasAttribute('data-rank')).length,
        creationDateMarkers: cards.filter((card) => card.hasAttribute('data-created') || card.querySelector('time, .project-created-date')).length,
        titles: cards.map((card) => card.querySelector('h3')?.textContent.trim()),
        columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
        brokenImages: [...element.querySelectorAll('img')].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src),
        overflow: document.documentElement.scrollWidth - innerWidth,
      };
    }, testCase.card);

    if (initial.visible !== 20) throw new Error(`${testCase.label} initial visible count ${initial.visible}`);
    if (initial.detailsOpen !== 0) throw new Error(`${testCase.label} technical details must start closed`);
    if (initial.rankRibbons !== 0 || initial.rankAttributes !== 0) throw new Error(`${testCase.label} ranking labels remain`);
    if (initial.creationDateMarkers !== 0) throw new Error(`${testCase.label} creation dates must remain hidden`);
    if (initial.titles.slice(0, 3).join('|') !== 'Gnostobot|Mike Kindle OS|Mundus Vult Decipi' || initial.titles.at(-1) !== 'michaelcostea.com / MICHAEL OS 89') throw new Error(`${testCase.label} creation-date order wrong`);
    if (initial.columns !== testCase.columns) throw new Error(`${testCase.label} expected ${testCase.columns} columns, got ${initial.columns}`);
    if (initial.brokenImages.length) throw new Error(`${testCase.label} broken images: ${initial.brokenImages.join(', ')}`);
    if (initial.overflow > 1) throw new Error(`${testCase.label} horizontal overflow ${initial.overflow}px`);

    await root.locator('[data-project-filter="devices"]').click();
    const deviceTitles = await root.locator(`${testCase.card}:not([hidden]) h3`).allTextContents();
    if (deviceTitles.join('|') !== 'Mike Kindle OS|Myo Control / Myo Patchbay|LEGO Mario Hardware + Asset Mapping') {
      throw new Error(`${testCase.label} device filter wrong: ${deviceTitles.join('|')}`);
    }
    if ((await root.locator('.project-browser-count').textContent()).trim() !== '3 projects') throw new Error(`${testCase.label} filtered count wrong`);

    await root.locator('.project-browser-search').fill('kindle');
    const searchTitles = await root.locator(`${testCase.card}:not([hidden]) h3`).allTextContents();
    if (searchTitles.join('|') !== 'Mike Kindle OS') throw new Error(`${testCase.label} search result wrong: ${searchTitles.join('|')}`);

    await root.locator('[data-project-filter="all"]').click();
    await root.locator('.project-browser-search').fill('');
    const firstDetails = root.locator(`${testCase.card}:not([hidden]) .app-store-details`).first();
    await firstDetails.locator('summary').click();
    if (!(await firstDetails.evaluate((details) => details.open))) throw new Error(`${testCase.label} technical details did not open`);
    await firstDetails.locator('summary').click();

    await page.screenshot({ path: path.join(outputDir, `${testCase.label}.png`), fullPage: false });
    if (errors.length) throw new Error(`${testCase.label} browser errors: ${errors.join(' | ')}`);
    results.push({ label: testCase.label, ...initial, deviceFilter: deviceTitles.length, search: searchTitles[0] });
    await context.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
