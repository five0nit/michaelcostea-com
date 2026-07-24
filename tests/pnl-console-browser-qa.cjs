#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const base = (process.env.PAGE_URL || 'http://127.0.0.1:4188').replace(/\/$/, '');
const outDir = process.env.QA_OUT || '/tmp/michael-pnl-console-qa';
fs.mkdirSync(outDir, { recursive: true });

async function pageMetrics(page) {
  return page.evaluate(() => ({
    dataView: document.querySelector('#app')?.dataset.currentView,
    title: document.querySelector('h1')?.textContent.trim(),
    strategyCount: document.querySelectorAll('#strategy-grid .strategy-card').length,
    strategyDeclared: Number(document.querySelector('#strategy-count')?.dataset.value || 0),
    profileDeclared: Number(document.querySelector('#profile-count')?.dataset.value || 0),
    resultCount: Number(document.querySelector('#result-count')?.dataset.value || 0),
    chartCount: document.querySelectorAll('.chart-shell svg').length,
    chartLabels: [...document.querySelectorAll('.chart-shell')].map(node => node.getAttribute('aria-label')),
    pageScrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    bodyScrollWidth: document.body.scrollWidth,
    filterBarTop: document.querySelector('.filter-bar')?.getBoundingClientRect().top,
    brokenImages: [...document.images].filter(image => image.complete && image.naturalWidth === 0).map(image => image.src),
    resultRows: document.querySelectorAll('#result-table-body tr').length,
    runRows: document.querySelectorAll('#run-table-body tr').length,
    strategyCardsHaveBars: [...document.querySelectorAll('#strategy-grid .strategy-card')].every(card => Boolean(card.querySelector('.metric-bar'))),
    truthBanner: document.querySelector('#truth-banner')?.textContent || '',
    paperArenaHref: document.querySelector('#paper-arena-link')?.getAttribute('href') || '',
    paperArenaText: document.querySelector('#paper-arena-link')?.textContent || '',
    paperArenaSync: document.querySelector('#paper-arena-sync-status')?.textContent || '',
    walletsHidden: getComputedStyle(document.querySelector('#wallets')).display === 'none',
    activeToggle: document.querySelector('#data-view-toggle button.active')?.dataset.dataView,
    overflowOffenders: [...document.querySelectorAll('body *')]
      .filter(node => !node.closest('.table-scroll'))
      .map(node => ({ node, rect: node.getBoundingClientRect() }))
      .filter(item => item.rect.right > window.innerWidth + 1 || item.rect.left < -1)
      .slice(0, 12)
      .map(item => ({ tag: item.node.tagName, id: item.node.id, className: String(item.node.className).slice(0, 80), left: item.rect.left, right: item.rect.right, width: item.rect.width })),
  }));
}

function assertNoVisualFailures(label, metrics) {
  if (metrics.pageScrollWidth > metrics.innerWidth + 1 || metrics.bodyScrollWidth > metrics.innerWidth + 1) throw new Error(`${label}: horizontal page overflow metrics=${JSON.stringify({pageScrollWidth:metrics.pageScrollWidth,bodyScrollWidth:metrics.bodyScrollWidth,innerWidth:metrics.innerWidth})} offenders=${JSON.stringify(metrics.overflowOffenders)}`);
  if (metrics.brokenImages.length) throw new Error(`${label}: broken images ${metrics.brokenImages.join(', ')}`);
  if (!metrics.strategyCardsHaveBars) throw new Error(`${label}: strategy cards missing data bars`);
  if (!metrics.resultRows || metrics.resultRows > 50) throw new Error(`${label}: result pagination invalid (${metrics.resultRows})`);
}

async function inspect(browser, label, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror:${error.message}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console:${message.text()}`); });
  const response = await page.goto(`${base}/ops/pnl-console/`, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForSelector('#strategy-grid .strategy-card', { timeout: 30_000 });
  await page.waitForTimeout(400);

  const paper = await pageMetrics(page);
  if (response?.status() !== 200) throw new Error(`${label}: HTTP ${response?.status()}`);
  if (paper.dataView !== 'paper-arena' || paper.activeToggle !== 'paper-arena') throw new Error(`${label}: Paper Arena is not the default main view`);
  if (paper.strategyCount !== 1) throw new Error(`${label}: Paper Arena should show one scoped strategy, got ${paper.strategyCount}`);
  if (paper.profileDeclared < 1 || paper.resultCount < 1 || paper.runRows < 1) throw new Error(`${label}: Paper Arena profile/result/run summary incomplete`);
  if (!paper.walletsHidden) throw new Error(`${label}: auto wallet layer leaked into Paper Arena view`);
  if (!paper.truthBanner.includes('PAPER ARENA') || !paper.truthBanner.includes('FAKE ONLY')) throw new Error(`${label}: Paper Arena truth banner missing`);
  if (paper.paperArenaHref !== 'http://localhost:8790/' || !paper.paperArenaText.includes('main dashboard view')) throw new Error(`${label}: Paper Arena local link/data receipt missing`);
  if (!paper.paperArenaSync.includes('AUTO SYNC') || !paper.paperArenaSync.includes('ANONYMIZED')) throw new Error(`${label}: Paper Arena automatic sync evidence missing`);
  assertNoVisualFailures(`${label}/paper`, paper);
  await page.screenshot({ path: path.join(outDir, `${label}-paper-arena-view.png`), fullPage: true });

  await page.click('[data-data-view="auto-trade"]');
  await page.waitForFunction(() => document.querySelector('#app')?.dataset.currentView === 'auto-trade');
  await page.waitForTimeout(180);
  const auto = await pageMetrics(page);
  if (auto.activeToggle !== 'auto-trade' || auto.walletsHidden) throw new Error(`${label}: Auto Trade view did not activate`);
  if (auto.strategyCount < 12 || auto.strategyCount > auto.strategyDeclared) throw new Error(`${label}: auto strategy preview invalid (${auto.strategyCount}/${auto.strategyDeclared})`);
  if (auto.resultCount < 1300) throw new Error(`${label}: auto result data incomplete`);
  if (auto.chartCount < 4 || auto.chartLabels.some(text => !text)) throw new Error(`${label}: auto visualization coverage incomplete`);
  if (!auto.truthBanner.includes('WALLET TRUTH')) throw new Error(`${label}: wallet-truth banner missing in Auto Trade view`);
  assertNoVisualFailures(`${label}/auto`, auto);

  await page.click('#strategy-show-all');
  await page.waitForTimeout(120);
  const expandedCount = await page.locator('#strategy-grid .strategy-card').count();
  if (expandedCount !== auto.strategyDeclared) throw new Error(`${label}: show-all rendered ${expandedCount}, data says ${auto.strategyDeclared}`);
  await page.click('#strategy-show-all');
  await page.waitForTimeout(120);

  await page.selectOption('#venue-filter', 'Polymarket');
  await page.waitForTimeout(150);
  const filtered = await page.evaluate(() => ({
    count: document.querySelectorAll('#strategy-grid .strategy-card').length,
    venues: [...document.querySelectorAll('#strategy-grid .strategy-card')].map(card => card.dataset.venue),
  }));
  if (!filtered.count || filtered.count >= auto.strategyCount) throw new Error(`${label}: venue filter did not reduce strategy cards`);
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
  await page.screenshot({ path: path.join(outDir, `${label}-auto-trade-view.png`), fullPage: true });
  if (errors.length) throw new Error(`${label}: browser errors ${errors.join(' | ')}`);
  await page.close();
  return { label, paper, auto, polymarketStrategies: filtered.count };
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
