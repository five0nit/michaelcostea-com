#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const base = (process.env.PAGE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const outDir = process.env.QA_OUT || '/tmp/michael-contact-image-qa';
fs.mkdirSync(outDir, { recursive: true });

async function inspect(browser, label, width, height, wideWindow = false) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.route('https://www.google-analytics.com/**', route => route.fulfill({ status: 204, body: '' }));
  await page.route('https://www.google.com/g/collect**', route => route.fulfill({ status: 204, body: '' }));
  const errors = [];
  page.on('pageerror', err => errors.push(`pageerror:${err.message}`));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`console:${msg.text()}`); });

  const response = await page.goto(`${base}/#contact`, { waitUntil: 'networkidle', timeout: 45_000 });
  await page.waitForSelector('#contactWindow.open .contact-visual img');
  await page.waitForFunction(() => {
    const image = document.querySelector('#contactWindow .contact-visual img');
    return image?.complete && image.naturalWidth > 0;
  });

  if (wideWindow) {
    await page.evaluate(() => {
      const win = document.querySelector('#contactWindow');
      win.classList.add('user-sized');
      Object.assign(win.style, {
        left: '24px',
        top: '20px',
        width: 'calc(100vw - 48px)',
        height: 'calc(100vh - 86px)',
      });
    });
  }
  await page.waitForTimeout(250);

  const checks = await page.evaluate(() => {
    const win = document.querySelector('#contactWindow');
    const body = win?.querySelector('.win-body');
    const layout = win?.querySelector('.contact-layout');
    const intro = win?.querySelector('.contact-intro');
    const figure = win?.querySelector('.contact-visual');
    const image = figure?.querySelector('img');
    const buttons = [...win.querySelectorAll('.contact-action-row .btn')];
    const rect = element => {
      const value = element?.getBoundingClientRect();
      return value ? { left: value.left, right: value.right, top: value.top, bottom: value.bottom, width: value.width, height: value.height } : null;
    };
    const winRect = rect(win);
    const bodyRect = rect(body);
    return {
      statusOpen: win?.classList.contains('open'),
      pageScrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      winRect,
      bodyRect,
      bodyClientWidth: body?.clientWidth,
      bodyScrollWidth: body?.scrollWidth,
      bodyClientHeight: body?.clientHeight,
      bodyScrollHeight: body?.scrollHeight,
      gridTemplateColumns: getComputedStyle(layout).gridTemplateColumns,
      gridTemplateAreas: getComputedStyle(layout).gridTemplateAreas,
      introRect: rect(intro),
      figureRect: rect(figure),
      imageRect: rect(image),
      imageSrc: image?.getAttribute('src'),
      imageComplete: image?.complete,
      imageNaturalWidth: image?.naturalWidth,
      imageNaturalHeight: image?.naturalHeight,
      buttonRects: buttons.map(rect),
      brokenImages: [...document.images].filter(img => !img.dataset.src && img.complete && img.naturalWidth === 0).map(img => img.currentSrc || img.src),
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });

  if (response?.status() !== 200) throw new Error(`${label} HTTP ${response?.status()}`);
  if (!checks.statusOpen) throw new Error(`${label} contact window did not open`);
  if (checks.imageSrc !== 'assets/site-art/contact-robot.webp') throw new Error(`${label} stale contact artwork source: ${checks.imageSrc}`);
  if (!checks.imageComplete || checks.imageNaturalWidth !== 500 || checks.imageNaturalHeight !== 540) throw new Error(`${label} contact artwork did not paint at 500x540`);
  if (checks.pageScrollWidth > checks.innerWidth + 1) throw new Error(`${label} horizontal page overflow`);
  if ((checks.winRect?.left ?? -1) < -1 || (checks.winRect?.right ?? Infinity) > checks.innerWidth + 1) throw new Error(`${label} contact window outside viewport`);
  if ((checks.bodyScrollWidth ?? Infinity) > (checks.bodyClientWidth ?? 0) + 1) throw new Error(`${label} contact body horizontal overflow`);
  if (checks.buttonRects.some(button => button.left < checks.bodyRect.left - 1 || button.right > checks.bodyRect.right + 1)) throw new Error(`${label} contact action outside body bounds`);
  if (checks.imageRect.width > 321 || checks.imageRect.width < 180) throw new Error(`${label} contact artwork width is not controlled: ${checks.imageRect.width}`);
  const renderedRatio = checks.imageRect.width / checks.imageRect.height;
  if (Math.abs(renderedRatio - (500 / 540)) > 0.02) throw new Error(`${label} contact artwork ratio distorted: ${renderedRatio}`);
  if (label === 'desktop' && checks.figureRect.right > checks.introRect.left + 1) throw new Error(`${label} artwork overlaps intro column`);
  if (label === 'mobile' && checks.introRect.top >= checks.figureRect.top) throw new Error(`${label} intro must lead before artwork on mobile`);
  if (!checks.reducedMotion) throw new Error(`${label} reduced-motion emulation not active`);
  if (checks.brokenImages.length) throw new Error(`${label} broken images: ${checks.brokenImages.join(', ')}`);
  if (errors.length) throw new Error(`${label} browser errors: ${errors.join(' | ')}`);

  await page.screenshot({ path: path.join(outDir, `${label}-contact.png`), fullPage: false });
  await page.close();
  return { label, status: response.status(), ...checks };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    results.push(await inspect(browser, 'desktop', 1280, 1000, true));
    results.push(await inspect(browser, 'mobile', 390, 844, false));
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify({ base, outDir, results }, null, 2));
})().catch(err => { console.error(err); process.exit(1); });
