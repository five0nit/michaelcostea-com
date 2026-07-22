#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('/home/fiv30nit/.openclaw/workspace/node_modules/playwright');

const base = process.env.PAGE_URL || 'http://127.0.0.1:4188';
const out = process.env.QA_OUT || '/tmp/michael-career-resume-qa';
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const [label, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await page.route('https://www.google-analytics.com/**', route => route.fulfill({ status: 204, body: '' }));
    await page.route('https://www.google.com/g/collect**', route => route.fulfill({ status: 204, body: '' }));
    const errors = [];
    page.on('pageerror', error => errors.push(`page:${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error' && !/favicon|ERR_BLOCKED_BY_CLIENT/.test(message.text())) errors.push(`console:${message.text()}`);
    });
    const response = await page.goto(`${base}/#resume`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#resumeWindow.open');
    await page.waitForSelector('.career-fit-summary');

    await page.evaluate(async () => {
      const images = [...document.querySelectorAll('#resumeWindow img')];
      for (const image of images) {
        image.scrollIntoView({ block: 'center' });
        try { await image.decode(); } catch (_) {}
      }
      const body = document.querySelector('#resumeWindow .win-body');
      if (body) body.scrollTop = 0;
      window.scrollTo(0, 0);
    });

    const checks = await page.evaluate(() => {
      const resume = document.querySelector('#resumeWindow');
      const resumeRect = resume.getBoundingClientRect();
      const buttons = [...document.querySelectorAll('#resumeWindow .resume-download-row .ui-btn')];
      const brokenImages = [...document.querySelectorAll('#resumeWindow img')].filter(image => image.complete && image.naturalWidth === 0).map(image => image.getAttribute('src'));
      return {
        title: document.title,
        hash: location.hash,
        resumeOpen: resume.classList.contains('open'),
        targetRoles: document.querySelector('#resumeWindow .target-role-line')?.innerText,
        caseCount: document.querySelectorAll('#resumeWindow .career-fit-case').length,
        experienceCount: document.querySelectorAll('#resumeWindow .timeline-list .mini-content-card').length,
        printableHref: document.querySelector('#resumeWindow a[href*="michael-costea-resume-2026.html"]')?.getAttribute('href'),
        stylesheetHref: document.querySelector('link[href*="career-resume.css"]')?.getAttribute('href'),
        tokenThroughput: document.querySelector('#resumeWindow .token-throughput-evidence b')?.innerText,
        hasVerticalStack: document.querySelector('#resumeWindow')?.textContent.includes('Vertical full-stack app delivery') && document.querySelector('#resumeWindow')?.textContent.includes('Hermes Agent'),
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: innerWidth,
        resumeLeft: resumeRect.left,
        resumeRight: resumeRect.right,
        resumeWidth: resumeRect.width,
        buttonHeights: buttons.map(button => Math.round(button.getBoundingClientRect().height)),
        evidenceColumns: getComputedStyle(document.querySelector('#resumeWindow .career-evidence-grid')).gridTemplateColumns,
        brokenImages,
      };
    });

    if (!response || response.status() !== 200) throw new Error(`${label} root status ${response?.status()}`);
    if (!checks.resumeOpen || checks.hash !== '#resume') throw new Error(`${label} direct resume route failed: ${JSON.stringify(checks)}`);
    if (!checks.targetRoles?.includes('AI Enablement Lead')) throw new Error(`${label} target roles missing`);
    if (checks.caseCount !== 3 || checks.experienceCount < 8) throw new Error(`${label} resume content counts wrong`);
    if (checks.printableHref !== 'assets/downloads/michael-costea-resume-2026.html') throw new Error(`${label} printable link wrong`);
    if (!checks.stylesheetHref?.includes('20260723-vertical-app-routing')) throw new Error(`${label} career stylesheet cache marker missing`);
    if (checks.tokenThroughput !== '4.3–4.5B' || !checks.hasVerticalStack) throw new Error(`${label} vertical stack or token throughput evidence missing`);
    if (checks.scrollWidth > checks.innerWidth + 1) throw new Error(`${label} page horizontal overflow ${checks.scrollWidth}>${checks.innerWidth}`);
    if (checks.resumeLeft < -1 || checks.resumeRight > checks.innerWidth + 1) throw new Error(`${label} resume window outside viewport`);
    if (label === 'mobile' && checks.buttonHeights.some(height => height < 40)) throw new Error(`mobile resume action too short: ${checks.buttonHeights}`);
    if (checks.brokenImages.length) throw new Error(`${label} broken resume images: ${checks.brokenImages.join(', ')}`);
    if (errors.length) throw new Error(`${label} JS errors: ${errors.join(' | ')}`);

    const screenshot = path.join(out, `site-resume-${label}.png`);
    await page.screenshot({ path: screenshot });
    results.push({ label, status: response.status(), ...checks, screenshot });
    await page.close();
  }

  const printable = await browser.newPage({ viewport: { width: 1280, height: 960 } });
  const printableErrors = [];
  printable.on('pageerror', error => printableErrors.push(`page:${error.message}`));
  printable.on('console', message => { if (message.type() === 'error') printableErrors.push(`console:${message.text()}`); });
  const printableResponse = await printable.goto(`${base}/assets/downloads/michael-costea-resume-2026.html`, { waitUntil: 'networkidle' });
  const printableChecks = await printable.evaluate(() => ({
    title: document.title,
    pages: document.querySelectorAll('.page').length,
    pageMetrics: [...document.querySelectorAll('.page')].map(page => ({
      width: Math.round(page.getBoundingClientRect().width),
      height: Math.round(page.getBoundingClientRect().height),
      clientHeight: page.clientHeight,
      scrollHeight: page.scrollHeight,
    })),
    targetText: document.querySelector('.target')?.innerText,
    hasExpandedScope: document.body.innerText.includes('Business Systems, Lead Flow & Digital Infrastructure'),
    hasOptusScale: document.body.innerText.includes('500,000'),
    tokenThroughput: [...document.querySelectorAll('.proof b')].map(node => node.innerText).find(text => text.includes('4.3')),
    hasHarnessRouting: document.body.innerText.includes('Hermes Agent') && document.body.innerText.includes('OpenAI Codex and APIs') && document.body.innerText.includes('Anthropic Claude') && document.body.innerText.includes('local LLM routing'),
    selectedProjects: [...document.querySelectorAll('.selected-project h3')].map(heading => heading.innerText),
    hasRejectedPortfolioCopy: document.body.innerText.includes('Public agent-observability project') || document.documentElement.innerHTML.includes('telegram-office'),
    printButton: document.querySelector('.screen-actions button')?.innerText,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
  }));
  if (!printableResponse || printableResponse.status() !== 200) throw new Error(`printable status ${printableResponse?.status()}`);
  if (printableChecks.pages !== 2) throw new Error(`printable page count ${printableChecks.pages}`);
  if (!printableChecks.targetText?.includes('AI Enablement Lead') || !printableChecks.hasExpandedScope || !printableChecks.hasOptusScale) throw new Error('printable content missing');
  if (printableChecks.tokenThroughput !== '4.3–4.5B' || !printableChecks.hasHarnessRouting) throw new Error('printable vertical stack, harness routing or token throughput evidence missing');
  const expectedProjects = ['Codex Account Usage + Auth Rotator', 'Automated Social Life & Brand Engine', 'Brief2Ship', 'RebateSignal'];
  if (JSON.stringify(printableChecks.selectedProjects) !== JSON.stringify(expectedProjects)) throw new Error(`printable projects wrong: ${JSON.stringify(printableChecks.selectedProjects)}`);
  if (printableChecks.hasRejectedPortfolioCopy) throw new Error('printable resume still exposes rejected Telegram Office portfolio copy');
  if (printableChecks.printButton !== 'Print / Save PDF') throw new Error(`printable action missing: ${printableChecks.printButton}`);
  for (const [index, metric] of printableChecks.pageMetrics.entries()) {
    if (metric.scrollHeight > metric.clientHeight + 1) throw new Error(`printable page ${index + 1} clips content: ${JSON.stringify(metric)}`);
  }
  await printable.emulateMedia({ media: 'print' });
  const printMediaChecks = await printable.evaluate(() => ({
    actionDisplay: getComputedStyle(document.querySelector('.screen-actions')).display,
    firstPageMargin: getComputedStyle(document.querySelector('.page')).margin,
  }));
  if (printMediaChecks.actionDisplay !== 'none') throw new Error(`print action visible in print media: ${printMediaChecks.actionDisplay}`);
  await printable.emulateMedia({ media: 'screen' });
  if (printableChecks.scrollWidth > printableChecks.innerWidth + 1) throw new Error(`printable desktop overflow ${printableChecks.scrollWidth}>${printableChecks.innerWidth}`);
  if (printableErrors.length) throw new Error(`printable JS errors: ${printableErrors.join(' | ')}`);
  const printableScreenshot = path.join(out, 'printable-resume-full.png');
  await printable.screenshot({ path: printableScreenshot, fullPage: true });
  results.push({ label: 'printable', status: printableResponse.status(), ...printableChecks, screenshot: printableScreenshot });
  await printable.close();

  await browser.close();
  console.log(JSON.stringify({ base, results }, null, 2));
})().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
