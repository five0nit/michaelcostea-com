#!/usr/bin/env node
// Deterministic mid-animation assertions, interruptions and accessibility gates.
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { chromium } = require('/home/fiv30nit/.openclaw/workspace/node_modules/playwright');
const base = process.env.PAGE_URL || 'http://127.0.0.1:8147';
const out = process.env.QA_OUT || '/tmp/michaelos-fluid-transitions';
fs.mkdirSync(out,{recursive:true});
const report = {base,checks:[],errors:[]};
const settled = page => page.waitForFunction(()=>!document.querySelector('[data-os-motion]'));
async function sample(page, action, id='aboutWindow', progress=.35){
  return page.evaluate(({action,id,progress})=>{
    window[action](id);
    const win = document.getElementById(id);
    const animation = win.getAnimations().find(a=>a.effect.target === win);
    if(animation){ animation.pause(); animation.currentTime = animation.effect.getTiming().duration*progress; }
    const style = getComputedStyle(win);
    return {kind:win.dataset.osMotion,rect:win.getBoundingClientRect().toJSON(),display:style.display,opacity:Number(style.opacity),scale:style.scale,translate:style.translate,inert:win.inert,hidden:win.getAttribute('aria-hidden'),pointer:style.pointerEvents,open:win.classList.contains('open'),count:win.getAnimations().length};
  },{action,id,progress});
}
async function finish(page){
  await page.evaluate(()=>document.querySelectorAll('[data-os-motion]').forEach(w=>w.getAnimations().forEach(a=>a.finish())));
  await settled(page);
}
(async()=>{
  const browser = await chromium.launch({headless:true});
  try{
    for(const mobile of [false,true]){
      const context = await browser.newContext({viewport:mobile ? {width:390,height:844} : {width:1440,height:1000},isMobile:mobile,hasTouch:mobile});
      await context.route('**/*', route=> /googletagmanager|google-analytics|google\.com\/g\/collect/.test(route.request().url()) ? route.fulfill({status:200,contentType:'application/javascript',body:''}) : route.continue());
      const page = await context.newPage();
      page.on('pageerror',e=>report.errors.push(e.message));
      await page.goto(base,{waitUntil:'networkidle'});
      await page.waitForSelector('body.os-motion-ready');
      const opening = await sample(page,'openWindow');
      assert.equal(opening.kind,'open');
      assert.ok(opening.opacity > 0 && opening.opacity < 1,'actual content must fade in');
      assert.notEqual(opening.translate,'none');
      await page.screenshot({path:path.join(out,mobile ? 'mobile-opening.png' : 'desktop-opening.png')});
      await finish(page);
      const beforeMax = await page.locator('#aboutWindow').boundingBox();
      const taskbarTop = await page.locator('.taskbar').evaluate(el=>el.getBoundingClientRect().top);
      assert.ok(beforeMax.y >= 0 && beforeMax.y+beforeMax.height <= taskbarTop+4,'new window must fit above the taskbar');
      const maximizing = await sample(page,'toggleMaximizeWindow');
      assert.equal(maximizing.kind,'geometry');
      assert.ok(maximizing.rect.width > beforeMax.width && maximizing.rect.width < (mobile ? 390 : 1440),'maximize must interpolate actual geometry');
      await finish(page);
      const restoring = await sample(page,'toggleMaximizeWindow');
      assert.equal(restoring.kind,'geometry');
      await finish(page);
      const restored = await page.locator('#aboutWindow').boundingBox();
      assert.ok(Math.abs(restored.width-beforeMax.width)<2);
      const minimizing = await sample(page,'minimizeWindow');
      assert.equal(minimizing.kind,'minimize');
      assert.equal(minimizing.inert,true);
      assert.equal(minimizing.hidden,'true');
      assert.equal(minimizing.pointer,'none');
      assert.notEqual(minimizing.display,'none','exit content must remain painted');
      if(!mobile) assert.ok(minimizing.rect.width < restored.width,'window must shrink toward taskbar');
      await finish(page);
      assert.equal(await page.locator('#aboutWindow').isVisible(),false);
      if(!mobile){
        await page.click('.task-btn[data-focus="aboutWindow"]');
        assert.equal(await page.locator('#aboutWindow').getAttribute('data-os-motion'),'restore');
      }else await page.evaluate(()=>openWindow('aboutWindow'));
      await settled(page);
      const closing = await sample(page,'closeWindow');
      assert.equal(closing.kind,'close');
      assert.equal(closing.inert,true);
      assert.ok(closing.opacity > 0 && closing.opacity < 1);
      await finish(page);
      assert.equal(await page.locator('#aboutWindow').isVisible(),false);
      // Old completion handlers must not hide a newly reopened window.
      await page.evaluate(()=>{ for(let i=0;i<8;i++){ openWindow('aboutWindow'); closeWindow('aboutWindow'); } openWindow('aboutWindow'); });
      await settled(page);
      assert.equal(await page.locator('#aboutWindow').isVisible(),true);
      assert.equal(await page.locator('#aboutWindow').getAttribute('aria-hidden'),'false');
      assert.equal(await page.locator('[data-os-exiting]').count(),0);
      // Motion preference changes mid-flight must synchronously settle content.
      await page.evaluate(()=>{minimizeWindow('aboutWindow');prefs.animations=false;applyPrefs();});
      assert.equal(await page.locator('[data-os-motion]').count(),0);
      await page.evaluate(()=>openWindow('aboutWindow'));
      assert.equal(await page.locator('[data-os-motion]').count(),0);
      await page.evaluate(()=>{prefs.animations=true;applyPrefs();closeWindow('aboutWindow');openWindow('aboutWindow');});
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(()=>!document.querySelector('[data-os-motion]'));
      const reduced = await sample(page,'toggleMaximizeWindow');
      assert.equal(reduced.kind,undefined);
      await page.evaluate(()=>closeWindow('aboutWindow'));
      assert.equal(await page.locator('[data-os-exiting]').count(),0);
      await page.emulateMedia({reducedMotion:'no-preference'});
      // Closing an iframe then immediately reopening must not blank the new source.
      const caseSource = await page.locator('#projectsWindow .featured-hiring-case a.ui-btn').first().getAttribute('href');
      await page.evaluate(src=>{ const frame=document.getElementById('caseStudyFrame');frame.src=src;openWindow('caseStudyWindow');closeWindow('caseStudyWindow');frame.src=src;openWindow('caseStudyWindow'); },caseSource);
      await settled(page);
      await page.waitForTimeout(240);
      assert.equal(await page.locator('#caseStudyFrame').getAttribute('src'),caseSource);
      await page.evaluate(()=>{closeWindow('caseStudyWindow');openWindow('caseStudyWindow');minimizeWindow('caseStudyWindow');});
      await settled(page);
      assert.equal(await page.locator('#caseStudyFrame').getAttribute('src'),caseSource,'old close timeout must not clear a newly minimized frame');
      await page.evaluate(()=>{closeWindow('caseStudyWindow');openWindow('projectsWindow');});
      await settled(page);
      assert.equal(new URL(page.url()).hash,'#projects');
      if(mobile) assert.equal(await page.locator('.win-window.open').count(),1);
      const bounds = await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,active:document.activeElement?.id}));
      assert.equal(bounds.width,bounds.scroll,'horizontal page overflow');
      await page.screenshot({path:path.join(out,mobile ? 'mobile-settled.png' : 'desktop-settled.png')});
      report.checks.push({mobile,opening,maximizing,minimizing,closing,bounds,passed:true});
      await context.close();
    }
    assert.deepEqual(report.errors,[]);
    report.ok=true;
  }catch(error){report.failure=error.stack;throw error;}
  finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
  console.log(JSON.stringify({ok:report.ok,out,viewports:report.checks.length,errors:report.errors}));
})().catch(e=>{console.error(e);process.exit(1);});
