#!/usr/bin/env node
const path=require('path');
const fs=require('fs');
const {chromium}=require('/home/fiv30nit/.openclaw/workspace/node_modules/playwright');
const url=process.env.PAGE_URL||'http://127.0.0.1:4190/freelancer-client-admin-starter-kit.html';
const out=process.env.QA_OUT||'/tmp/freelancer-client-admin-site-qa';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/snap/bin/chromium'});
 for(const [name,viewport] of Object.entries({desktop:{width:1440,height:1000},mobile:{width:390,height:844}})){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});
  await page.route('https://www.googletagmanager.com/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
  const errors=[];
  page.on('console',m=>{if(m.type()==='error') errors.push(m.text())});
  page.on('pageerror',e=>errors.push(String(e)));
  const response=await page.goto(url,{waitUntil:'networkidle'});
  if(!response||!response.ok()) throw new Error(`${name}: bad response`);
  await page.locator('.preview-grid').scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await page.evaluate(()=>scrollTo(0,0));
  const metrics=await page.evaluate(()=>({
    title:document.title,
    status:document.body.dataset.launchStatus,
    h1:document.querySelector('h1')?.textContent?.trim(),
    cta:document.querySelector('.primary-cta')?.textContent?.trim(),
    href:document.querySelector('.primary-cta')?.href,
    analyticsLoader:[...document.scripts].some(s=>s.src.includes('googletagmanager.com/gtag/js?id=G-C0YHGXH33P')),
    checkoutEvents:[...document.querySelectorAll('a.primary-cta')].map(a=>a.dataset.analyticsEvent),
    sampleEvent:document.querySelector('a.sample-cta')?.dataset.analyticsEvent,
    overflow:document.documentElement.scrollWidth>innerWidth,
    width:innerWidth,
    scrollWidth:document.documentElement.scrollWidth,
    images:[...document.images].map(i=>({src:i.getAttribute('src'),naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,displayWidth:i.getBoundingClientRect().width,right:i.getBoundingClientRect().right,alt:i.getAttribute('alt')})),
  }));
  if(metrics.overflow) throw new Error(`${name}: horizontal overflow ${metrics.scrollWidth}>${metrics.width}`);
  if(metrics.status!=='live'||!metrics.h1||!metrics.cta) throw new Error(`${name}: hero/status missing`);
  if(metrics.href!=='https://costeamichael.gumroad.com/l/freelancer-client-admin-starter-kit') throw new Error(`${name}: bad CTA`);
  if(!metrics.analyticsLoader||metrics.checkoutEvents.length!==2||metrics.checkoutEvents.some(e=>e!=='begin_checkout')||metrics.sampleEvent!=='select_content') throw new Error(`${name}: analytics contract failed`);
  if(metrics.images.length!==3||metrics.images.some(i=>!i.naturalWidth||i.right>metrics.width+.5||i.displayWidth<=0||!i.alt)) throw new Error(`${name}: image load/fit/alt failed ${JSON.stringify(metrics.images)}`);
  if(errors.length) throw new Error(`${name}: console errors ${errors.join(' | ')}`);
  const emitted=await page.evaluate(()=>{
    window.dataLayer=[];
    const checkout=document.querySelector('a.primary-cta');
    checkout.addEventListener('click',e=>e.preventDefault(),{once:true});
    checkout.click();
    const checkoutEvents=window.dataLayer.map(row=>Array.from(row));
    window.dataLayer=[];
    const sample=document.querySelector('a.sample-cta');
    sample.addEventListener('click',e=>e.preventDefault(),{once:true});
    sample.click();
    const sampleEvents=window.dataLayer.map(row=>Array.from(row));
    return {checkoutEvents,sampleEvents};
  });
  if(!emitted.checkoutEvents.some(row=>row[0]==='event'&&row[1]==='begin_checkout')) throw new Error(`${name}: begin_checkout not emitted`);
  if(!emitted.sampleEvents.some(row=>row[0]==='event'&&row[1]==='select_content')) throw new Error(`${name}: select_content not emitted`);
  await page.screenshot({path:path.join(out,`freelancer-client-admin-starter-kit-${name}.png`),fullPage:true});
  console.log(JSON.stringify({viewport:name,...metrics,consoleErrors:0}));
  await page.close();
 }
 const home=new URL('/',url).href;
 const homePage=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 await homePage.route('https://www.googletagmanager.com/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
 const homeErrors=[];homePage.on('console',m=>{if(m.type()==='error') homeErrors.push(m.text())});homePage.on('pageerror',e=>homeErrors.push(String(e)));
 const homeResponse=await homePage.goto(home,{waitUntil:'networkidle'});
 if(!homeResponse||!homeResponse.ok()) throw new Error('homepage: bad response');
 const ownedPath=homePage.locator('a[data-owned-path="freelancer-admin"]');
 if(await ownedPath.count()!==1||!(await ownedPath.isVisible())) throw new Error('homepage: qualified owned path not visible');
 const homeMetrics=await homePage.evaluate(()=>({href:document.querySelector('a[data-owned-path="freelancer-admin"]')?.href,text:document.querySelector('a[data-owned-path="freelancer-admin"]')?.textContent?.trim(),overflow:document.documentElement.scrollWidth>innerWidth}));
 if(homeMetrics.href!=='http://127.0.0.1:4190/freelancer-admin/?utm_source=michaelcostea.com&utm_medium=owned_homepage&utm_campaign=freelancer_admin_launch'&&homeMetrics.href!=='https://michaelcostea.com/freelancer-admin/?utm_source=michaelcostea.com&utm_medium=owned_homepage&utm_campaign=freelancer_admin_launch') throw new Error(`homepage: bad owned path ${homeMetrics.href}`);
 if(homeMetrics.text!=='Open the US$5 kit'||homeMetrics.overflow||homeErrors.length) throw new Error(`homepage: path/layout/console gate failed ${JSON.stringify({homeMetrics,homeErrors})}`);
 await homePage.screenshot({path:path.join(out,'freelancer-client-admin-homepage-mobile.png'),fullPage:false});
 console.log(JSON.stringify({viewport:'homepage-mobile',...homeMetrics,consoleErrors:0}));
 await homePage.close();
 await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
