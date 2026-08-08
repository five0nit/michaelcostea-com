#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = (process.env.PAGE_URL || 'http://127.0.0.1:4174').replace(/\/$/, '');
const outDir = process.env.QA_OUT || '/tmp/retro-animation-variants-qa';
fs.mkdirSync(outDir, { recursive: true });
async function inspect(browser, variant, viewport, reducedMotion = false) {
  const label = `v${variant}-${viewport.label}${reducedMotion ? '-reduced' : ''}`;
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(`page:${error.message}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console:${message.text()}`); });
  page.on('requestfailed', request => errors.push(`request:${request.url()} ${request.failure()?.errorText || ''}`));
  const response = await page.goto(`${base}/preview/retro-animation-${variant}/?qa=1`, { waitUntil: 'networkidle', timeout: 45_000 });
  assert.equal(response?.status(), 200, `${label} HTTP`);
  await page.waitForFunction(() => window.__RETRO_VARIANT_READY__ === true);
  await page.waitForFunction(() => window.__RETRO_VARIANT_STATE__?.final === true, null, { timeout: 5_000 });
  await page.waitForTimeout(800);
  const data = await page.evaluate((variant) => {
    const rect = selector => { const r = document.querySelector(selector)?.getBoundingClientRect(); return r ? { left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height } : null; };
    const mainSelector = variant === 1 ? '.site-window' : '.title-window';
    const main = document.querySelector(mainSelector);
    const style = main && getComputedStyle(main);
    const image = document.querySelector('.mini-body img');
    return {
      state: window.__RETRO_VARIANT_STATE__,
      innerWidth, innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      mainRect: rect(mainSelector),
      mainOpacity: style?.opacity,
      mainTransform: style?.transform,
      title: document.title,
      imageNaturalWidth: image?.naturalWidth || null,
      agents: document.querySelectorAll('.agent').length,
      crashWindows: document.querySelectorAll('.crash-window').length,
      navLinks: [...document.querySelectorAll('.sequence-footer nav a,.variant-nav a')].map(a => a.getAttribute('href')),
    };
  }, variant);
  assert.equal(data.state.variant, variant, `${label} state variant`);
  assert.equal(data.state.final, true, `${label} final frame`);
  assert.equal(data.scrollWidth, data.innerWidth, `${label} horizontal overflow`);
  assert.ok(data.mainRect && data.mainRect.left >= -1 && data.mainRect.right <= data.innerWidth + 1, `${label} main frame horizontal bounds`);
  assert.ok(data.mainRect.top >= -1 && data.mainRect.bottom <= data.innerHeight + 1, `${label} main frame vertical bounds`);
  assert.equal(data.mainOpacity, '1', `${label} final frame visible`);
  if (variant === 1) {
    assert.equal(data.agents, 7, `${label} agents`);
    assert.ok(data.imageNaturalWidth > 0, `${label} Mini Michael image`);
  } else {
    assert.equal(data.crashWindows, 6, `${label} crash windows`);
    assert.equal(data.state.pixelCount, 56, `${label} pixels`);
  }
  assert.deepEqual(errors, [], `${label} browser errors`);
  await page.screenshot({ path: path.join(outDir, `${label}.png`) });
  if (!reducedMotion) {
    await page.locator('[data-replay]').last().click();
    await page.waitForTimeout(40);
    assert.equal(await page.evaluate(() => window.__RETRO_VARIANT_STATE__.step), 0, `${label} replay resets`);
  }
  await context.close();
  return { label, ...data };
}
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const results=[];
    for(const variant of [1,2]){
      results.push(await inspect(browser,variant,{label:'desktop',width:1440,height:900}));
      results.push(await inspect(browser,variant,{label:'mobile',width:390,height:844}));
      results.push(await inspect(browser,variant,{label:'reduced',width:1280,height:800},true));
    }
    console.log(JSON.stringify({base,outDir,results:results.map(r=>({label:r.label,state:r.state,scrollWidth:r.scrollWidth,innerWidth:r.innerWidth,mainRect:r.mainRect}))},null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
