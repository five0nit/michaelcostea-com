#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const {chromium}=require('/home/fiv30nit/.openclaw/workspace/node_modules/playwright');
const url=process.env.GUIDE_URL||'http://127.0.0.1:4191/guides/freelancer-client-tracker/';
const out=process.env.GUIDE_QA_OUT||'/tmp/freelancer-client-tracker-guide-qa';
fs.mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'/snap/bin/chromium'});
  for(const [name,viewport] of Object.entries({desktop:{width:1440,height:1000},mobile:{width:390,height:844}})){
    const page=await browser.newPage({viewport,deviceScaleFactor:1});
    await page.route('https://www.googletagmanager.com/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
    const errors=[];
    page.on('console',message=>{if(message.type()==='error') errors.push(message.text())});
    page.on('pageerror',error=>errors.push(String(error)));
    const response=await page.goto(url,{waitUntil:'networkidle'});
    if(!response||!response.ok()) throw new Error(`${name}: bad response`);
    await page.locator('.proof').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.evaluate(()=>scrollTo(0,0));
    const metrics=await page.evaluate(()=>({
      title:document.title,
      h1:document.querySelector('h1')?.textContent?.trim(),
      steps:document.querySelectorAll('.step').length,
      overflow:document.documentElement.scrollWidth>innerWidth,
      width:innerWidth,
      scrollWidth:document.documentElement.scrollWidth,
      images:[...document.images].map(image=>({src:image.getAttribute('src'),naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,right:image.getBoundingClientRect().right,displayWidth:image.getBoundingClientRect().width,alt:image.getAttribute('alt')})),
      checkoutLinks:[...document.querySelectorAll('a[data-analytics-event="begin_checkout"]')].map(link=>({href:link.href,itemId:link.dataset.analyticsItemId})),
      resourceLinks:[...document.querySelectorAll('a[data-analytics-event="select_content"]')].map(link=>({href:link.href,itemId:link.dataset.analyticsItemId})),
      analyticsLoader:[...document.scripts].some(script=>script.src.includes('googletagmanager.com/gtag/js?id=G-C0YHGXH33P')),
    }));
    if(metrics.overflow) throw new Error(`${name}: horizontal overflow ${metrics.scrollWidth}>${metrics.width}`);
    if(!metrics.h1||metrics.steps!==6||!metrics.analyticsLoader) throw new Error(`${name}: content or analytics loader missing`);
    if(metrics.images.length!==3||metrics.images.some(image=>!image.naturalWidth||image.right>metrics.width+.5||image.displayWidth<=0||!image.alt)) throw new Error(`${name}: image load/fit/alt failed ${JSON.stringify(metrics.images)}`);
    if(metrics.checkoutLinks.length!==2||metrics.checkoutLinks.some(link=>link.href!=='https://costeamichael.gumroad.com/l/freelancer-client-admin-starter-kit'||link.itemId!=='freelancer_client_admin_starter_kit')) throw new Error(`${name}: checkout link contract failed`);
    if(metrics.resourceLinks.length!==3||metrics.resourceLinks.some(link=>!link.itemId)) throw new Error(`${name}: resource link contract failed`);
    if(errors.length) throw new Error(`${name}: console errors ${errors.join(' | ')}`);
    const emitted=await page.evaluate(()=>{
      const results=[];
      for(const link of document.querySelectorAll('a[data-analytics-event]')){
        window.dataLayer=[];
        link.addEventListener('click',event=>event.preventDefault(),{once:true});
        link.click();
        results.push({eventName:link.dataset.analyticsEvent,itemId:link.dataset.analyticsItemId,rows:window.dataLayer.map(row=>Array.from(row))});
      }
      return results;
    });
    for(const event of emitted){
      const exact=event.rows.find(row=>row[0]==='event'&&row[1]===event.eventName);
      if(!exact) throw new Error(`${name}: ${event.eventName} not emitted`);
      const emittedItem=event.eventName==='begin_checkout'?exact[2]?.items?.[0]?.item_id:exact[2]?.item_id;
      if(emittedItem!==event.itemId) throw new Error(`${name}: ${event.eventName} item mismatch ${emittedItem} != ${event.itemId}`);
    }
    await page.screenshot({path:path.join(out,`freelancer-client-tracker-guide-${name}.png`),fullPage:true});
    console.log(JSON.stringify({viewport:name,...metrics,analyticsEventsVerified:emitted.length,consoleErrors:0}));
    await page.close();
  }
  await browser.close();
})().catch(error=>{console.error(error.stack||error);process.exit(1)});
