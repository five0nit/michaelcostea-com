#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('/home/fiv30nit/.openclaw/workspace/node_modules/playwright');

const base = process.env.PAGE_URL || 'http://127.0.0.1:8147';
const out = process.env.QA_OUT || '/tmp/michaelos-motion-browser-qa';
fs.mkdirSync(out, { recursive: true });
const must = (condition, message) => { if (!condition) throw new Error(message); };
const rounded = rect => rect && Object.fromEntries(['x','y','width','height'].map(k => [k, Math.round(rect[k] * 10) / 10]));

(async()=>{
  const browser = await chromium.launch({ headless:true });
  const report = { base, desktop:{}, reducedMotion:{}, mobile:{}, failures:[] };
  try{
    const context = await browser.newContext({ viewport:{ width:1440, height:1000 }, deviceScaleFactor:1 });
    await context.addInitScript(()=>localStorage.removeItem('michaelos_prefs_v1'));
    const page = await context.newPage();
    const errors = [];
    const failedRequests = [];
    page.on('pageerror', error => errors.push(`pageerror:${error.message}`));
    page.on('console', message => { if(message.type() === 'error') errors.push(`console:${message.text()}`); });
    page.on('requestfailed', request => failedRequests.push(`${request.url()} :: ${request.failure()?.errorText || 'failed'}`));
    await page.goto(base, { waitUntil:'networkidle' });
    await page.waitForSelector('body.os-motion-ready');

    report.desktop.initial = await page.evaluate(()=>({
      soundPressed: document.getElementById('soundToggle')?.getAttribute('aria-pressed'),
      bootHidden: document.getElementById('bootScreen')?.classList.contains('hidden'),
      desktopIcons: document.querySelectorAll('.desktop-icons .os-icon').length,
      windowTransition: getComputedStyle(document.getElementById('aboutWindow')).transitionDuration,
      startTransition: getComputedStyle(document.getElementById('startMenu')).transitionDuration,
      motionLink: document.querySelector('link[href*="michaelos-motion.css"]')?.href || '',
    }));
    must(report.desktop.initial.soundPressed === 'false', 'desktop sound should default off');
    must(report.desktop.initial.bootHidden, 'boot must not block first render');
    must(report.desktop.initial.desktopIcons === 11, 'desktop sprite icon count mismatch');
    must(report.desktop.initial.motionLink.includes('20260803-motion-6'), 'motion CSS cache marker missing');

    const readerBefore = await page.locator('#readerWindow').boundingBox();
    await page.click('#readerWindow .win-max');
    await page.waitForTimeout(20);
    const readerMax = await page.locator('#readerWindow').boundingBox();
    const readerViewport = await page.evaluate(()=>({width:innerWidth,height:innerHeight,taskbar:document.querySelector('.taskbar').getBoundingClientRect().height}));
    must(Math.abs(readerMax.x) <= 1 && Math.abs(readerMax.y) <= 1 && Math.abs(readerMax.width-readerViewport.width) <= 1, `main portfolio maximize wrong: ${JSON.stringify(rounded(readerMax))}`);
    must(Math.abs(readerMax.height-(readerViewport.height-readerViewport.taskbar)) <= 1, `main portfolio maximize height wrong: ${JSON.stringify({rect:rounded(readerMax),readerViewport})}`);
    await page.click('#readerWindow .win-max');
    await page.waitForTimeout(190);
    const readerRestored = await page.locator('#readerWindow').boundingBox();
    report.desktop.readerGeometry = { before:rounded(readerBefore), maximized:rounded(readerMax), restored:rounded(readerRestored) };
    must(Math.abs(readerRestored.x-readerBefore.x) <= 2 && Math.abs(readerRestored.y-readerBefore.y) <= 2, `main portfolio restore wrong: ${JSON.stringify(report.desktop.readerGeometry)}`);

    await page.click('#startBtn');
    await page.waitForTimeout(130);
    report.desktop.startOpen = await page.evaluate(()=>({
      open: document.getElementById('startMenu').classList.contains('open'),
      visibility: getComputedStyle(document.getElementById('startMenu')).visibility,
      clipPath: getComputedStyle(document.getElementById('startMenu')).clipPath,
    }));
    must(report.desktop.startOpen.open && report.desktop.startOpen.visibility === 'visible', 'Start menu did not open');
    must(!report.desktop.startOpen.clipPath.includes('100%'), `Start menu reveal did not complete: ${report.desktop.startOpen.clipPath}`);
    await page.screenshot({ path:path.join(out,'desktop-start-menu.png'), fullPage:false });
    await page.keyboard.press('Escape');

    const icon = page.locator('.desktop-icons [data-open="aboutWindow"]');
    await icon.click();
    report.desktop.singleClick = await page.evaluate(()=>({
      selected: document.querySelector('[data-open="aboutWindow"]')?.classList.contains('os-selected'),
      aboutOpen: document.getElementById('aboutWindow')?.classList.contains('open'),
    }));
    must(report.desktop.singleClick.selected, 'desktop single click must select icon');
    must(!report.desktop.singleClick.aboutOpen, 'desktop single click must not open icon');

    await icon.dblclick();
    await page.waitForFunction(()=>document.getElementById('aboutWindow')?.classList.contains('open'));
    await page.waitForTimeout(220);
    const title = page.locator('#aboutWindow .win-title');
    const titleBox = await title.boundingBox();
    must(titleBox, 'about titlebar missing');
    await page.mouse.move(titleBox.x + 120, titleBox.y + 12);
    await page.mouse.down();
    await page.mouse.move(titleBox.x + 300, 20, { steps:8 });
    await page.mouse.up();
    const moved = await page.locator('#aboutWindow').boundingBox();

    await page.click('#aboutWindow .win-max');
    await page.waitForTimeout(20);
    const maximized = await page.locator('#aboutWindow').boundingBox();
    const viewport = await page.evaluate(()=>({ width:innerWidth, height:innerHeight, taskbar:document.querySelector('.taskbar')?.getBoundingClientRect().height || 0 }));
    report.desktop.geometry = { moved:rounded(moved), maximized:rounded(maximized), viewport };
    must(Math.abs(maximized.x) <= 1 && Math.abs(maximized.y) <= 1, `maximize after drag origin wrong: ${JSON.stringify(rounded(maximized))}`);
    must(Math.abs(maximized.width - viewport.width) <= 1, `maximize after drag width wrong: ${maximized.width}`);
    must(maximized.height <= viewport.height + 1 && maximized.height >= viewport.height - viewport.taskbar - 2, `maximize height wrong: ${maximized.height}`);

    await page.click('#aboutWindow .win-max');
    await page.waitForTimeout(20);
    const restored = await page.locator('#aboutWindow').boundingBox();
    report.desktop.geometry.restored = rounded(restored);
    must(Math.abs(restored.x - moved.x) <= 2 && Math.abs(restored.y - moved.y) <= 2, `restore did not return moved geometry: ${JSON.stringify(report.desktop.geometry)}`);

    const grip = page.locator('#aboutWindow .win-resize-grip');
    const gripBox = await grip.boundingBox();
    must(gripBox, 'about resize grip missing');
    await page.mouse.move(gripBox.x + gripBox.width - 3, gripBox.y + gripBox.height - 3);
    await page.mouse.down();
    await page.mouse.move(gripBox.x + gripBox.width + 70, gripBox.y + gripBox.height + 30, { steps:8 });
    await page.mouse.up();
    const resized = await page.locator('#aboutWindow').boundingBox();
    must(resized.width > restored.width && resized.height >= restored.height, `resize did not change geometry: ${JSON.stringify({restored:rounded(restored),resized:rounded(resized)})}`);
    await page.click('#aboutWindow .win-max');
    await page.waitForTimeout(20);
    const resizedMax = await page.locator('#aboutWindow').boundingBox();
    must(Math.abs(resizedMax.x) <= 1 && Math.abs(resizedMax.y) <= 1 && Math.abs(resizedMax.width-viewport.width) <= 1, `maximize after resize wrong: ${JSON.stringify(rounded(resizedMax))}`);
    await page.click('#aboutWindow .win-max');
    await page.waitForTimeout(20);
    const resizedRestored = await page.locator('#aboutWindow').boundingBox();
    report.desktop.geometry.resizeCycle = { resized:rounded(resized), maximized:rounded(resizedMax), restored:rounded(resizedRestored) };
    must(Math.abs(resizedRestored.width-resized.width) <= 2 && Math.abs(resizedRestored.height-resized.height) <= 2, `resize restore geometry wrong: ${JSON.stringify(report.desktop.geometry.resizeCycle)}`);

    await page.click('#aboutWindow .win-min');
    const minimizeOutline = await page.locator('.os-motion-outline').count();
    must(await page.locator('#aboutWindow').evaluate(el=>el.classList.contains('minimized')), 'window did not minimize');
    const task = page.locator('.task-btn[data-focus="aboutWindow"]');
    must(await task.count() === 1, 'minimized task button missing');
    await page.waitForTimeout(180);
    await task.click();
    const restoreOutline = await page.locator('.os-motion-outline').count();
    await page.waitForFunction(()=>document.getElementById('aboutWindow')?.classList.contains('open'));
    report.desktop.outlines = { minimizeOutline, restoreOutline };
    must(minimizeOutline > 0 && restoreOutline > 0, `window outline animation missing: ${JSON.stringify(report.desktop.outlines)}`);

    await page.click('#soundToggle');
    report.desktop.soundOn = await page.evaluate(()=>({
      pressed: document.getElementById('soundToggle')?.getAttribute('aria-pressed'),
      pref: JSON.parse(localStorage.getItem('michaelos_prefs_v1') || '{}').uiSound,
    }));
    must(report.desktop.soundOn.pressed === 'true' && report.desktop.soundOn.pref === true, 'sound toggle did not persist');

    await page.click('#startBtn');
    await page.click('[data-action="toggle-motion"]');
    must(await page.locator('body').evaluate(el=>el.classList.contains('no-anim')), 'manual motion-off class missing');
    await page.click('[data-action="toggle-motion"]');
    must(!await page.locator('body').evaluate(el=>el.classList.contains('no-anim')), 'manual motion-on class missing');
    await page.keyboard.press('Escape');

    await page.click('#startBtn');
    await page.click('[data-action="restart-os"]');
    await page.waitForFunction(()=>!document.getElementById('bootScreen')?.classList.contains('hidden'));
    await page.click('#bootSkip');
    await page.waitForFunction(()=>document.getElementById('bootScreen')?.classList.contains('hidden'), null, { timeout:1500 });
    report.desktop.boot = await page.evaluate(()=>({ hidden:document.getElementById('bootScreen').classList.contains('hidden'), bodyBooted:document.body.classList.contains('booted') }));
    must(report.desktop.boot.hidden && report.desktop.boot.bodyBooted, 'safe optional boot did not finish');

    await page.evaluate(()=>window.openWindow('projectsWindow'));
    await page.waitForTimeout(220);
    const firstCase = page.locator('#projectsWindow .featured-hiring-case a.ui-btn').first();
    const caseHref = await firstCase.getAttribute('href');
    await firstCase.click();
    await page.waitForFunction(()=>document.getElementById('caseStudyWindow')?.classList.contains('open'));
    report.desktop.caseLaunch = await page.evaluate(()=>({
      caseWindowOpen:document.getElementById('caseStudyWindow').classList.contains('open'),
      frameSrc:document.getElementById('caseStudyFrame').getAttribute('src'),
      caseTitle:document.getElementById('caseStudyTitle').textContent,
    }));
    must(report.desktop.caseLaunch.caseWindowOpen && report.desktop.caseLaunch.frameSrc === caseHref, `case did not launch in MichaelOS window: ${JSON.stringify(report.desktop.caseLaunch)}`);
    await page.waitForTimeout(260);
    await page.screenshot({ path:path.join(out,'desktop-case-window.png'), fullPage:false });
    await page.click('#caseStudyWindow .win-close');
    await page.waitForFunction(()=>!document.getElementById('caseStudyWindow')?.classList.contains('open'));
    const archive = page.locator('#projectsWindow .project-archive-shell');
    await archive.locator('summary').click();
    await page.waitForFunction(()=>document.querySelector('#projectsWindow .project-archive-shell')?.open === true);
    await page.waitForTimeout(230);
    await archive.locator('summary').click();
    await page.waitForFunction(()=>document.querySelector('#projectsWindow .project-archive-shell')?.open === false);
    report.desktop.archive = { openClose:true };

    await page.screenshot({ path:path.join(out,'desktop-motion.png'), fullPage:false });
    report.desktop.errors = errors;
    report.desktop.failedRequests = failedRequests;
    const knownTagDnsFailure = failedRequests.some(entry=>entry.includes('googletagmanager.com') && entry.includes('ERR_NAME_NOT_RESOLVED'));
    const actionableErrors = errors.filter(entry=>!(knownTagDnsFailure && entry.includes('ERR_NAME_NOT_RESOLVED')));
    report.desktop.actionableErrors = actionableErrors;
    must(actionableErrors.length === 0, `desktop browser errors: ${actionableErrors.join(' | ')}`);
    await context.close();

    const reducedContext = await browser.newContext({ viewport:{ width:1280, height:900 }, reducedMotion:'reduce' });
    await reducedContext.addInitScript(()=>localStorage.removeItem('michaelos_prefs_v1'));
    const reduced = await reducedContext.newPage();
    await reduced.goto(base, { waitUntil:'networkidle' });
    await reduced.click('#startBtn');
    await reduced.evaluate(()=>window.openWindow('aboutWindow'));
    report.reducedMotion = await reduced.evaluate(()=>({
      allowed: window.motionAllowed(),
      outlineCount: document.querySelectorAll('.os-motion-outline').length,
      startTransition: getComputedStyle(document.getElementById('startMenu')).transitionDuration,
      titleTransition: getComputedStyle(document.querySelector('#aboutWindow .win-title')).transitionDuration,
    }));
    must(report.reducedMotion.allowed === false, 'reduced motion must disable JS motion');
    must(report.reducedMotion.outlineCount === 0, 'reduced motion must not create outline');
    must(report.reducedMotion.startTransition.split(',').every(v=>v.trim()==='0s'), `reduced Start transition not zero: ${report.reducedMotion.startTransition}`);
    await reducedContext.close();

    const mobileContext = await browser.newContext({ viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true, deviceScaleFactor:1 });
    await mobileContext.addInitScript(()=>localStorage.removeItem('michaelos_prefs_v1'));
    const mobile = await mobileContext.newPage();
    const mobileErrors = [];
    const mobileFailedRequests = [];
    mobile.on('pageerror', error=>mobileErrors.push(`pageerror:${error.message}`));
    mobile.on('console', message=>{ if(message.type()==='error') mobileErrors.push(`console:${message.text()}`); });
    mobile.on('requestfailed', request=>mobileFailedRequests.push(`${request.url()} :: ${request.failure()?.errorText || 'failed'}`));
    await mobile.goto(base, { waitUntil:'networkidle' });
    await mobile.click('#readerWindow .win-close');
    await mobile.waitForFunction(()=>!document.getElementById('readerWindow')?.classList.contains('open'));
    await mobile.tap('.desktop-icons [data-open="aboutWindow"]');
    await mobile.waitForFunction(()=>document.getElementById('aboutWindow')?.classList.contains('open'));
    await mobile.waitForTimeout(220);
    const mobileBeforeMax = await mobile.locator('#aboutWindow').boundingBox();
    await mobile.click('#aboutWindow .win-max');
    await mobile.waitForTimeout(20);
    const mobileMax = await mobile.locator('#aboutWindow').boundingBox();
    const mobileViewport = await mobile.evaluate(()=>({width:innerWidth,height:innerHeight,taskbar:document.querySelector('.taskbar').getBoundingClientRect().height}));
    must(Math.abs(mobileMax.x) <= 1 && Math.abs(mobileMax.y) <= 1 && Math.abs(mobileMax.width-mobileViewport.width) <= 1, `mobile maximize wrong: ${JSON.stringify(rounded(mobileMax))}`);
    must(Math.abs(mobileMax.height-(mobileViewport.height-mobileViewport.taskbar)) <= 1, `mobile maximize height wrong: ${JSON.stringify({rect:rounded(mobileMax),mobileViewport})}`);
    await mobile.click('#aboutWindow .win-max');
    await mobile.waitForTimeout(20);
    const mobileRestored = await mobile.locator('#aboutWindow').boundingBox();
    must(Math.abs(mobileRestored.x-mobileBeforeMax.x) <= 2 && Math.abs(mobileRestored.width-mobileBeforeMax.width) <= 2, `mobile restore wrong: ${JSON.stringify({before:rounded(mobileBeforeMax),restored:rounded(mobileRestored)})}`);
    report.mobile = await mobile.evaluate(()=>{
      const win = document.getElementById('aboutWindow');
      const rect = win.getBoundingClientRect();
      return {
        open:win.classList.contains('open'),
        left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,
        innerWidth,innerHeight,
        bodyOverflow:document.body.scrollWidth-document.body.clientWidth,
        taskbarBottom:document.querySelector('.taskbar')?.getBoundingClientRect().bottom,
        soundTarget:document.getElementById('soundToggle')?.getBoundingClientRect().width,
        errors:[],
      };
    });
    report.mobile.geometry = { before:rounded(mobileBeforeMax), maximized:rounded(mobileMax), restored:rounded(mobileRestored), viewport:mobileViewport };
    report.mobile.errors = mobileErrors;
    report.mobile.failedRequests = mobileFailedRequests;
    const mobileKnownTagDnsFailure = mobileFailedRequests.some(entry=>entry.includes('googletagmanager.com') && entry.includes('ERR_NAME_NOT_RESOLVED'));
    const mobileActionableErrors = mobileErrors.filter(entry=>!(mobileKnownTagDnsFailure && entry.includes('ERR_NAME_NOT_RESOLVED')));
    report.mobile.actionableErrors = mobileActionableErrors;
    must(report.mobile.open, 'mobile one-tap icon did not open');
    must(report.mobile.left >= -1 && report.mobile.right <= report.mobile.innerWidth + 1, `mobile window horizontal bounds wrong: ${JSON.stringify(report.mobile)}`);
    must(report.mobile.bodyOverflow <= 1, `mobile horizontal overflow: ${report.mobile.bodyOverflow}`);
    must(Math.abs(report.mobile.taskbarBottom - report.mobile.innerHeight) <= 1, 'mobile taskbar not fixed to viewport bottom');
    must(report.mobile.soundTarget >= 30, `mobile sound target too small: ${report.mobile.soundTarget}`);
    must(mobileActionableErrors.length === 0, `mobile browser errors: ${mobileActionableErrors.join(' | ')}`);
    await mobile.screenshot({ path:path.join(out,'mobile-motion.png'), fullPage:false });
    await mobileContext.close();

    fs.writeFileSync(path.join(out,'report.json'), JSON.stringify(report,null,2));
    console.log(JSON.stringify({ ok:true, out, geometry:report.desktop.geometry, reduced:report.reducedMotion, mobile:report.mobile }));
  } catch(error){
    report.failures.push(error.stack || String(error));
    fs.writeFileSync(path.join(out,'report.json'), JSON.stringify(report,null,2));
    throw error;
  } finally {
    await browser.close();
  }
})().catch(error=>{ console.error(error); process.exit(1); });
