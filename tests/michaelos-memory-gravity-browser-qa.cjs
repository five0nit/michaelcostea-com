#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const base = (process.env.PAGE_URL || 'http://127.0.0.1:4174').replace(/\/$/, '');
const route = '/preview/michaelos-memory-gravity/?qa=1';
const outDir = process.env.QA_OUT || '/tmp/michaelos-memory-gravity-qa';
fs.mkdirSync(outDir, { recursive: true });

async function inspect(browser, config) {
  const context = await browser.newContext({
    viewport: { width: config.width, height: config.height },
    deviceScaleFactor: 1,
    reducedMotion: config.reducedMotion ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  const errors = [];
  const failedRequests = [];
  page.on('pageerror', error => errors.push(`page:${error.message}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console:${message.text()}`); });
  page.on('requestfailed', request => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`));

  const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 45_000 });
  await page.waitForFunction(() => window.__MEMORY_GRAVITY_READY__ === true, null, { timeout: 10_000 });
  await page.waitForTimeout(config.reducedMotion ? 120 : 900);

  const initial = await page.evaluate(() => {
    const canvas = document.getElementById('data-field');
    const simulation = document.querySelector('.simulation-panel');
    const osWindow = document.querySelector('.os-window');
    const rect = element => {
      const r = element.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    return {
      state: window.__MEMORY_GRAVITY_STATE__,
      reducedFlag: document.body.dataset.reducedMotion || null,
      innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      canvasPixels: { width: canvas.width, height: canvas.height },
      canvasRect: rect(canvas),
      simulationRect: rect(simulation),
      windowRect: rect(osWindow),
      title: document.title,
      phaseCount: document.querySelectorAll('.phase-list li').length,
      activePhases: document.querySelectorAll('.phase-list li.active').length,
      sourceLinks: document.querySelectorAll('#sources-dialog a').length,
      pauseDisabled: document.getElementById('pause-button').disabled,
    };
  });

  if (response?.status() !== 200) throw new Error(`${config.label} HTTP ${response?.status()}`);
  if (!initial.state?.ready) throw new Error(`${config.label} animation state not ready`);
  if (initial.state.particleCount < 70) throw new Error(`${config.label} particle count too low: ${initial.state.particleCount}`);
  if (initial.state.width < 280 || initial.state.height < 420) throw new Error(`${config.label} invalid canvas geometry ${JSON.stringify(initial.state)}`);
  if (!initial.canvasPixels.width || !initial.canvasPixels.height) throw new Error(`${config.label} canvas backing store missing`);
  if (initial.scrollWidth > initial.innerWidth + 1 || initial.bodyScrollWidth > initial.innerWidth + 1) throw new Error(`${config.label} horizontal overflow ${JSON.stringify(initial)}`);
  if (initial.windowRect.left < -1 || initial.windowRect.right > initial.innerWidth + 1) throw new Error(`${config.label} window outside viewport ${JSON.stringify(initial.windowRect)}`);
  if (initial.phaseCount !== 5 || initial.activePhases !== 1) throw new Error(`${config.label} phase state invalid`);
  if (initial.sourceLinks !== 4) throw new Error(`${config.label} source receipt incomplete`);
  if (errors.length || failedRequests.length) throw new Error(`${config.label} browser errors ${[...errors, ...failedRequests].join(' | ')}`);

  if (config.reducedMotion) {
    if (initial.reducedFlag !== 'true' || !initial.pauseDisabled || initial.state.phaseName !== 'PROVE') {
      throw new Error(`${config.label} reduced-motion contract failed ${JSON.stringify(initial)}`);
    }
  } else {
    await page.locator('#pause-button').click();
    await page.waitForTimeout(80);
    const paused = await page.evaluate(() => ({
      pressed: document.getElementById('pause-button').getAttribute('aria-pressed'),
      state: window.__MEMORY_GRAVITY_STATE__,
      status: document.getElementById('status-message').textContent,
    }));
    if (paused.pressed !== 'true' || !paused.state.paused || !paused.status.includes('PAUSED')) throw new Error(`${config.label} pause failed ${JSON.stringify(paused)}`);

    await page.locator('[data-phase="3"] button').click();
    await page.waitForTimeout(100);
    const proof = await page.evaluate(() => ({
      phase: window.__MEMORY_GRAVITY_STATE__.phaseName,
      receipt: document.getElementById('receipt-value').textContent,
      proof: document.getElementById('proof-state').textContent,
    }));
    if (proof.phase !== 'PROVE' || proof.receipt !== 'VERIFIED' || proof.proof !== 'PASS') throw new Error(`${config.label} phase jump failed ${JSON.stringify(proof)}`);

    const canvasBox = await page.locator('#data-field').boundingBox();
    await page.mouse.click(canvasBox.x + canvasBox.width * 0.73, canvasBox.y + canvasBox.height * 0.51);
    await page.waitForTimeout(60);
    const pulse = await page.evaluate(() => window.__MEMORY_GRAVITY_STATE__.pulseCount);
    if (pulse < 1) throw new Error(`${config.label} canvas pulse failed`);
  }

  // Interaction checks can auto-scroll controls into view. Reset to a clean,
  // focus-free top state before capturing design evidence.
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.waitForTimeout(120);
  await page.screenshot({ path: path.join(outDir, `${config.label}.png`), fullPage: false });
  await context.close();
  return { label: config.label, status: response.status(), ...initial };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const results = [];
    results.push(await inspect(browser, { label: 'desktop', width: 1440, height: 900, reducedMotion: false }));
    results.push(await inspect(browser, { label: 'mobile', width: 390, height: 844, reducedMotion: false }));
    results.push(await inspect(browser, { label: 'reduced-motion', width: 1280, height: 800, reducedMotion: true }));
    console.log(JSON.stringify({ base, route, outDir, results }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
