#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const base = (process.env.PAGE_URL || 'http://127.0.0.1:4174').replace(/\/$/, '');
const outDir = process.env.QA_OUT || '/tmp/michaelos-doc-routes-qa';
fs.mkdirSync(outDir, { recursive: true });

const styledRoutes = [
  { slug: 'projects', path: '/projects/', title: 'PROJECTS.EXE' },
  { slug: 'work', path: '/work/', title: 'WORK.EXE' },
  { slug: 'business', path: '/work/business-operating-layer/', title: 'CASE_01.DOC' },
  { slug: 'knowledge', path: '/work/knowledge-operations/', title: 'CASE_02.DOC' },
  { slug: 'agents', path: '/work/governed-agent-infrastructure/', title: 'CASE_03.DOC' },
  { slug: 'privacy', path: '/privacy/', title: 'PRIVACY.TXT' },
];

async function inspect(page, route, label) {
  const errors = [];
  const onPageError = error => errors.push(`page:${error.message}`);
  const onConsole = message => { if (message.type() === 'error') errors.push(`console:${message.text()}`); };
  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  const response = await page.goto(`${base}${route.path}`, { waitUntil: 'networkidle', timeout: 45_000 });
  await page.waitForSelector('#main-content > .os-doc-titlebar');
  await page.waitForTimeout(120);

  const checks = await page.evaluate(() => {
    const rect = element => {
      const r = element?.getBoundingClientRect();
      return r ? { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height } : null;
    };
    const main = document.querySelector('#main-content');
    const titlebar = document.querySelector('.os-doc-titlebar');
    const hero = document.querySelector('.page-hero');
    const nav = document.querySelector('.site-header nav');
    const styles = [...document.querySelectorAll('link[rel="stylesheet"]')].map(link => link.getAttribute('href') || '');
    return {
      innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      styles,
      mainRect: rect(main),
      titlebarRect: rect(titlebar),
      heroRect: rect(hero),
      titlebarText: titlebar?.textContent.replace(/\s+/g, ' ').trim(),
      mainBackground: getComputedStyle(main).backgroundColor,
      bodyFont: getComputedStyle(document.body).fontFamily,
      bodyAfter: getComputedStyle(document.body, '::after').content,
      navDisplay: getComputedStyle(nav).display,
      brokenImages: [...document.images].filter(image => !image.dataset.src && image.complete && image.naturalWidth === 0).map(image => image.currentSrc || image.src),
    };
  });

  if (response?.status() !== 200) throw new Error(`${label}/${route.slug} HTTP ${response?.status()}`);
  if (!checks.styles.some(href => href.includes('michaelos-docs.css?v='))) throw new Error(`${label}/${route.slug} missing document CSS`);
  if (!checks.titlebarText.includes(route.title)) throw new Error(`${label}/${route.slug} title bar mismatch: ${checks.titlebarText}`);
  if (checks.mainBackground !== 'rgb(192, 192, 192)') throw new Error(`${label}/${route.slug} main window background ${checks.mainBackground}`);
  if (!/MS Sans Serif|Tahoma/.test(checks.bodyFont)) throw new Error(`${label}/${route.slug} wrong font family ${checks.bodyFont}`);
  if (!checks.bodyAfter.includes('MICHAEL OS 89')) throw new Error(`${label}/${route.slug} missing document taskbar status`);
  if (checks.documentWidth > checks.innerWidth + 1 || checks.bodyWidth > checks.innerWidth + 1) throw new Error(`${label}/${route.slug} horizontal overflow`);
  if (checks.mainRect.left < -1 || checks.mainRect.right > checks.innerWidth + 1) throw new Error(`${label}/${route.slug} main window outside viewport`);
  if (!checks.titlebarRect || checks.titlebarRect.height < 30) throw new Error(`${label}/${route.slug} title bar not visibly rendered`);
  if (!checks.heroRect || checks.heroRect.width < 250) throw new Error(`${label}/${route.slug} hero geometry invalid`);
  if (checks.brokenImages.length) throw new Error(`${label}/${route.slug} broken images: ${checks.brokenImages.join(', ')}`);
  if (errors.length) throw new Error(`${label}/${route.slug} browser errors: ${errors.join(' | ')}`);

  if (label === 'mobile' && route.slug === 'projects') {
    const button = page.locator('.menu-button');
    await button.click();
    const navOpen = await page.locator('#site-nav').getAttribute('data-open');
    if (navOpen !== 'true') throw new Error('mobile/projects menu did not open');
    await button.click();
  }

  if (label === 'desktop' && route.slug === 'work') {
    await page.locator('[data-open-os]').click();
    const dialogOpen = await page.locator('#os-dialog').evaluate(dialog => dialog.open);
    const frameSource = await page.locator('#os-dialog iframe').getAttribute('src');
    if (!dialogOpen || frameSource !== '/') throw new Error(`desktop/work Michael OS dialog failed: open=${dialogOpen} src=${frameSource}`);
    await page.locator('[data-close-os]').click();
  }

  if (['projects', 'knowledge', 'privacy'].includes(route.slug)) {
    await page.screenshot({ path: path.join(outDir, `${label}-${route.slug}.png`), fullPage: false });
  }

  page.off('pageerror', onPageError);
  page.off('console', onConsole);
  return { route: route.slug, status: response.status(), ...checks };
}

async function inspectResume(page, label) {
  const response = await page.goto(`${base}/resume/`, { waitUntil: 'networkidle', timeout: 45_000 });
  await page.waitForSelector('.resume-hero');
  const checks = await page.evaluate(() => {
    const styles = [...document.querySelectorAll('link[rel="stylesheet"]')].map(link => link.getAttribute('href') || '');
    return {
      innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      styles,
      titlebarCount: document.querySelectorAll('.os-doc-titlebar').length,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      bodyFont: getComputedStyle(document.body).fontFamily,
      heading: document.querySelector('.resume-hero h1')?.textContent.trim(),
    };
  });
  if (response?.status() !== 200) throw new Error(`${label}/resume HTTP ${response?.status()}`);
  if (checks.styles.some(href => href.includes('michaelos-docs.css'))) throw new Error(`${label}/resume inherited document route CSS`);
  if (checks.titlebarCount !== 0) throw new Error(`${label}/resume inherited OS document title bar`);
  if (!checks.heading) throw new Error(`${label}/resume heading missing`);
  if (checks.documentWidth > checks.innerWidth + 1) throw new Error(`${label}/resume horizontal overflow`);
  await page.screenshot({ path: path.join(outDir, `${label}-resume-control.png`), fullPage: false });
  return { route: 'resume-control', status: response.status(), ...checks };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const viewport of [
      { label: 'desktop', width: 1280, height: 1000 },
      { label: 'mobile', width: 390, height: 844 },
    ]) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' });
      await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
      await page.route('https://www.google-analytics.com/**', route => route.fulfill({ status: 204, body: '' }));
      for (const route of styledRoutes) results.push({ label: viewport.label, ...(await inspect(page, route, viewport.label)) });
      results.push({ label: viewport.label, ...(await inspectResume(page, viewport.label)) });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify({ base, outDir, results }, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
