#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const base = (process.env.PAGE_URL || 'http://127.0.0.1:4188').replace(/\/$/, '');
const outDir = process.env.QA_OUT || '/tmp/michael-pnl-console-qa';
fs.mkdirSync(outDir, { recursive: true });

async function inspect(browser, label, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror:${error.message}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console:${message.text()}`); });
  const response = await page.goto(`${base}/ops/pnl-console/`, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForSelector('#strategy-grid .strategy-card', { timeout: 30_000 });
  await page.waitForTimeout(400);

  const initial = await page.evaluate(() => ({
    title: document.querySelector('h1')?.textContent.trim(),
    strategyCount: document.querySelectorAll('#strategy-grid .strategy-card').length,
    declaredCount: Number(document.querySelector('#strategy-count')?.dataset.value || 0),
    resultCount: Number(document.querySelector('#result-count')?.dataset.value || 0),
    chartCount: document.querySelectorAll('.chart-shell svg').length,
    chartLabels: [...document.querySelectorAll('.chart-shell')].map(node => node.getAttribute('aria-label')),
    pageScrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    bodyScrollWidth: document.body.scrollWidth,
    filterBarTop: document.querySelector('.filter-bar')?.getBoundingClientRect().top,
    brokenImages: [...document.images].filter(image => image.complete && image.naturalWidth === 0).map(image => image.src),
    resultRows: document.querySelectorAll('#result-table-body tr').length,
    strategyCardsHaveBars: [...document.querySelectorAll('#strategy-grid .strategy-card')].every(card => Boolean(card.querySelector('.metric-bar'))),
    truthBanner: document.querySelector('#truth-banner')?.textContent || '',
    overflowOffenders: [...document.querySelectorAll('body *')]
      .filter(node => !node.closest('.table-scroll'))
      .map(node => ({ node, rect: node.getBoundingClientRect() }))
      .filter(item => item.rect.right > window.innerWidth + 1 || item.rect.left < -1)
      .slice(0, 12)
      .map(item => ({ tag: item.node.tagName, id: item.node.id, className: String(item.node.className).slice(0, 80), left: item.rect.left, right: item.rect.right, width: item.rect.width })),
  }));

  if (response?.status() !== 200) throw new Error(`${label}: HTTP ${response?.status()}`);
  if (initial.strategyCount < 12 || initial.strategyCount > initial.declaredCount) throw new Error(`${label}: strategy preview count invalid (${initial.strategyCount}/${initial.declaredCount})`);
  await page.click('#strategy-show-all');
  await page.waitForTimeout(120);
  const expandedCount = await page.locator('#strategy-grid .strategy-card').count();
  if (expandedCount !== initial.declaredCount) throw new Error(`${label}: show-all rendered ${expandedCount}, data says ${initial.declaredCount}`);
  await page.click('#strategy-show-all');
  await page.waitForTimeout(120);
  if (initial.resultCount < 1300) throw new Error(`${label}: result data incomplete`);
  if (initial.chartCount < 4) throw new Error(`${label}: expected at least four SVG visualizations`);
  if (initial.chartLabels.some(labelText => !labelText)) throw new Error(`${label}: chart accessibility label missing`);
  if (initial.pageScrollWidth > initial.innerWidth + 1 || initial.bodyScrollWidth > initial.innerWidth + 1) throw new Error(`${label}: horizontal page overflow metrics=${JSON.stringify({pageScrollWidth:initial.pageScrollWidth,bodyScrollWidth:initial.bodyScrollWidth,innerWidth:initial.innerWidth})} offenders=${JSON.stringify(initial.overflowOffenders)}`);
  if (initial.brokenImages.length) throw new Error(`${label}: broken images ${initial.brokenImages.join(', ')}`);
  if (!initial.strategyCardsHaveBars) throw new Error(`${label}: strategy cards missing data bars`);
  if (!initial.truthBanner.includes('WALLET TRUTH')) throw new Error(`${label}: wallet-truth banner missing`);
  if (!initial.resultRows || initial.resultRows > 50) throw new Error(`${label}: result pagination invalid (${initial.resultRows})`);

  await page.selectOption('#venue-filter', 'Polymarket');
  await page.waitForTimeout(150);
  const filtered = await page.evaluate(() => ({
    count: document.querySelectorAll('#strategy-grid .strategy-card').length,
    venues: [...document.querySelectorAll('#strategy-grid .strategy-card')].map(card => card.dataset.venue),
  }));
  if (!filtered.count || filtered.count >= initial.strategyCount) throw new Error(`${label}: venue filter did not reduce strategy cards`);
  if (filtered.venues.some(venue => venue !== 'Polymarket')) throw new Error(`${label}: venue filter leaked another venue`);

  await page.selectOption('#venue-filter', 'all');
  await page.fill('#strategy-search', 'liqmo');
  await page.waitForTimeout(150);
  const searchResult = await page.evaluate(() => [...document.querySelectorAll('#strategy-grid .strategy-card h3')].map(node => node.textContent.toLowerCase()));
  if (searchResult.length !== 1 || !searchResult[0].includes('liqmo')) throw new Error(`${label}: strategy search failed`);

  await page.fill('#strategy-search', '');
  await page.selectOption('#evidence-filter', 'wallet-executed');
  await page.waitForTimeout(150);
  const evidenceCards = await page.evaluate(() => [...document.querySelectorAll('#strategy-grid .strategy-card')].map(card => card.dataset.evidence));
  if (!evidenceCards.length || evidenceCards.some(value => value !== 'wallet-executed')) throw new Error(`${label}: evidence filter failed`);

  await page.selectOption('#evidence-filter', 'all');
  await page.screenshot({ path: path.join(outDir, `${label}-pnl-console.png`), fullPage: true });
  if (errors.length) throw new Error(`${label}: browser errors ${errors.join(' | ')}`);
  await page.close();
  return { label, ...initial, polymarketStrategies: filtered.count };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const results = [
      await inspect(browser, 'desktop', 1440, 1000),
      await inspect(browser, 'mobile', 390, 844),
    ];
    console.log(JSON.stringify({ base, results }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
