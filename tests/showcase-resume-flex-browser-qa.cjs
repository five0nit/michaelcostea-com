#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('/home/fiv30nit/.openclaw/workspace/node_modules/playwright');

const baseUrl = process.env.PAGE_URL || 'http://127.0.0.1:8793';
const outDir = path.resolve(process.env.QA_OUT || 'automation/reports/michaelcostea-showcase-implementation-2026-07-28');
fs.mkdirSync(outDir, { recursive: true });

function must(condition, message) {
  if (!condition) throw new Error(message);
}

async function routeChecks(request) {
  const routes = [
    '/resume/', '/projects/', '/work/', '/work/knowledge-operations/',
    '/work/business-operating-layer/', '/work/governed-agent-infrastructure/', '/privacy/'
  ];
  const results = [];
  for (const route of routes) {
    const response = await request.get(`${baseUrl}${route}`);
    const body = await response.text();
    results.push({ route, status: response.status(), title: body.match(/<title>(.*?)<\/title>/i)?.[1] || '' });
    must(response.status() === 200, `${route} returned ${response.status()}`);
    must(!/noindex/i.test(body.match(/<meta[^>]+name=["']robots["'][^>]*>/i)?.[0] || ''), `${route} remains noindex`);
  }
  const pdf = await request.get(`${baseUrl}/assets/downloads/Michael-Costea-Resume-2026.pdf`);
  must(pdf.status() === 200, `résumé PDF returned ${pdf.status()}`);
  must((await pdf.body()).length > 50000, 'résumé PDF is unexpectedly small');
  return results;
}

async function auditViewport(browser, name, viewport, mobile) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const page = await context.newPage();
  const consoleErrors = [];
  const requestFailures = [];
  const responses = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !/googletagmanager|google-analytics|ERR_NAME_NOT_RESOLVED/i.test(message.text())) consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    const errorText = request.failure()?.errorText || '';
    if (!/googletagmanager|googleapis|gstatic/i.test(request.url()) && !/ERR_ABORTED/.test(errorText)) requestFailures.push({ url: request.url(), error: errorText });
  });
  page.on('response', async (response) => {
    const url = response.url();
    if (!url.startsWith(baseUrl)) return;
    try { responses.push({ url, status: response.status(), bytes: (await response.body()).length }); } catch {}
  });

  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#readerWindow.open');
  const home = await page.evaluate(() => {
    const visible = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && rect.top < innerHeight && rect.bottom > 0;
    };
    return {
      title: document.title,
      activeId: document.activeElement?.id || '',
      h1: document.querySelector('#career-showcase-title')?.textContent.replace(/\s+/g, ' ').trim() || '',
      h1Visible: visible('#career-showcase-title'),
      proofVisible: visible('.career-proof-grid'),
      actionsVisible: [...document.querySelectorAll('.career-primary-actions > *')].map((element) => {
        const rect = element.getBoundingClientRect();
        return { text: element.textContent.trim(), top: rect.top, bottom: rect.bottom, visible: rect.top >= 0 && rect.bottom <= innerHeight };
      }),
      primaryActionCount: document.querySelectorAll('.career-primary-actions > a, .career-primary-actions > button').length,
      heroProductCount: document.querySelectorAll('#readerWindow [data-owned-path]').length,
      resourcesProductCount: document.querySelectorAll('#resourcesWindow [data-owned-path]').length,
      archiveOpen: document.querySelector('.project-archive-shell')?.open || false,
      heroTop: document.querySelector('.welcome-copy')?.getBoundingClientRect().top || 0,
      heroBottom: document.querySelector('.welcome-copy')?.getBoundingClientRect().bottom || 0,
      sidebarTop: document.querySelector('.welcome-sidebar')?.getBoundingClientRect().top || 0,
      taskbarTop: document.querySelector('.taskbar')?.getBoundingClientRect().top || innerHeight,
      deckSrcs: ['introDeckSlide', 'agenticDeckSlide'].map((id) => ({ id, src: document.getElementById(id)?.getAttribute('src') || '', deferred: document.getElementById(id)?.dataset.src || '' })),
      bodyOverflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  must(home.title.includes('Head of Tech, AI & Systems'), `${name}: title lacks role`);
  must(home.h1.includes('MICHAEL COSTEA') && home.h1.includes('HEAD OF TECH, AI & SYSTEMS'), `${name}: identity-first H1 missing`);
  must(home.h1Visible && home.proofVisible, `${name}: H1/proof not in first viewport`);
  must(home.primaryActionCount === 3 && home.actionsVisible.every((item) => item.visible), `${name}: all three primary actions must be in first viewport`);
  must(home.heroProductCount === 0 && home.resourcesProductCount >= 2, `${name}: product hierarchy incorrect`);
  must(!home.archiveOpen, `${name}: project archive should start collapsed`);
  must(home.deckSrcs.every((item) => !item.src && item.deferred), `${name}: closed deck media loaded eagerly`);
  must(!home.bodyOverflow, `${name}: horizontal page overflow`);

  await page.screenshot({ path: path.join(outDir, `home-${name}.png`), fullPage: true });
  const initialLocalBytes = responses.reduce((sum, item) => sum + item.bytes, 0);
  const initialUrls = responses.map((item) => item.url);

  if (mobile) {
    must(home.heroTop < home.sidebarTop, 'mobile: portrait/navigation still appears before identity and proof');
    must(home.actionsVisible.every((item) => item.bottom <= home.taskbarTop), 'mobile: taskbar obscures a primary action');
    must(home.actionsVisible.every((item) => item.bottom <= home.heroBottom), 'mobile: primary action clipped by hero scroll container');
    must(home.sidebarTop >= Math.max(...home.actionsVisible.map((item) => item.bottom)), 'mobile: portrait/navigation overlaps primary actions');

    await page.locator('#readerWindow .win-close').click();
    await page.waitForTimeout(100);
    const welcomeClosed = await page.evaluate(() => {
      const desktop = document.querySelector('.desktop-icons');
      const desktopStyle = desktop ? getComputedStyle(desktop) : null;
      return {
        readerOpen: document.getElementById('readerWindow')?.classList.contains('open') || false,
        readerHidden: document.getElementById('readerWindow')?.getAttribute('aria-hidden') === 'true',
        openWindowCount: document.querySelectorAll('.win-window.open').length,
        desktopVisible: !!desktop && desktopStyle.display !== 'none' && desktop.getBoundingClientRect().height > 0,
      };
    });
    must(!welcomeClosed.readerOpen && welcomeClosed.readerHidden, 'mobile: Welcome.exe close button immediately reopened the window');
    must(welcomeClosed.openWindowCount === 0, `mobile: expected desktop with no open window, found ${welcomeClosed.openWindowCount}`);
    must(welcomeClosed.desktopVisible, 'mobile: desktop icons not revealed after closing Welcome.exe');
    await page.screenshot({ path: path.join(outDir, 'desktop-after-welcome-close-mobile.png'), fullPage: true });

    await page.goto(`${baseUrl}/#projects`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#projectsWindow.open');
    const routed = await page.evaluate(() => ({
      hash: location.hash,
      activeId: document.activeElement?.id || '',
      desktopInert: document.querySelector('.desktop-icons')?.hasAttribute('inert') || false,
      readerInert: document.getElementById('readerWindow')?.hasAttribute('inert') || false,
    }));
    must(routed.hash === '#projects', `mobile: direct route changed to ${routed.hash}`);
    must(routed.activeId === 'projectsWindow', `mobile: routed window not focused (${routed.activeId})`);
    must(routed.desktopInert && routed.readerInert, 'mobile: background remains keyboard-active');

    await page.focus('.skip-link');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(50);
    const skipped = await page.evaluate(() => ({ hash: location.hash, activeId: document.activeElement?.id || '' }));
    must(skipped.hash === '#projects', `mobile: skip link cleared route to ${skipped.hash}`);
    must(skipped.activeId === 'projectsWindow', `mobile: skip link focused ${skipped.activeId}`);

    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    const opener = page.locator('.career-primary-actions [data-open="projectsWindow"]');
    await opener.click();
    await page.waitForSelector('#projectsWindow.open');
    await page.locator('#projectsWindow .win-close').click();
    await page.waitForSelector('#readerWindow.open');
    await page.waitForTimeout(50);
    const closed = await page.evaluate(() => ({
      hash: location.hash,
      activeText: document.activeElement?.textContent?.trim() || '',
      desktopInert: document.querySelector('.desktop-icons')?.hasAttribute('inert') || false,
    }));
    must(closed.hash === '' || closed.hash === '#home', `mobile: close did not return home (${closed.hash})`);
    must(closed.activeText === 'OPEN 3 CASE STUDIES', `mobile: close did not restore opener (${closed.activeText})`);
    must(!closed.desktopInert, 'mobile: background remained inert after close');

    await page.goto(`${baseUrl}/#projects`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outDir, 'projects-mobile.png'), fullPage: true });
  }

  must(initialLocalBytes < 1_500_000, `${name}: initial local transfer ${initialLocalBytes} exceeds 1.5MB`);
  must(!initialUrls.some((url) => /intro-to-ai\/slide-01|hermes-agentic-framework-session\/slide-01/.test(url)), `${name}: hidden deck slide requested on startup`);
  must(consoleErrors.length === 0, `${name}: console errors: ${consoleErrors.join(' | ')}`);
  must(requestFailures.length === 0, `${name}: request failures: ${JSON.stringify(requestFailures)}`);
  await context.close();
  return { name, viewport, home, initialLocalBytes, responses: responses.length, consoleErrors, requestFailures };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const apiContext = await browser.newContext();
  const routes = await routeChecks(apiContext.request);
  await apiContext.close();
  const desktop = await auditViewport(browser, 'desktop', { width: 1440, height: 1000 }, false);
  const mobile = await auditViewport(browser, 'mobile', { width: 390, height: 844 }, true);
  const result = { ok: true, baseUrl, routes, desktop, mobile };
  fs.writeFileSync(path.join(outDir, 'showcase-browser-qa.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
