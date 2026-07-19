#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const {chromium}=require('/home/fiv30nit/.openclaw/workspace/node_modules/playwright');
const url=process.env.PAGE_URL||'http://127.0.0.1:4188/guides/ai-automation-scope-of-work-template/';
const out=process.env.QA_OUT||'/tmp/ai-automation-scope-of-work-guide-qa';
fs.mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true});
  const results=[];
  for(const [label,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
    const page=await browser.newPage({viewport:{width,height}});
    await page.route('https://www.googletagmanager.com/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
    await page.route('https://www.google-analytics.com/**',route=>route.fulfill({status:204,body:''}));
    const errors=[];
    page.on('pageerror',e=>errors.push(`page:${e.message}`));
    page.on('console',m=>{if(m.type()==='error'&&!/googletagmanager|ERR_BLOCKED_BY_CLIENT|ERR_CONNECTION_REFUSED/.test(m.text()))errors.push(`console:${m.text()}`)});
    const response=await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('h1');
    const checks=await page.evaluate(()=>({
      title:document.title,
      h1:document.querySelector('h1')?.innerText,
      scrollWidth:document.documentElement.scrollWidth,
      innerWidth:window.innerWidth,
      templateLength:document.querySelector('#scope-template')?.textContent.length||0,
      sampleVisible:!!document.querySelector('[data-analytics-item-id="scope_proposal_fictional_sample"]')?.getBoundingClientRect().width,
      checkoutVisible:!!document.querySelector('[data-analytics-event="begin_checkout"]')?.getBoundingClientRect().width,
      utmHref:document.querySelector('a[href*="utm_source=scope_of_work_guide"]')?.getAttribute('href'),
      sitemapCanonical:document.querySelector('link[rel="canonical"]')?.href
    }));
    if(!response||response.status()!==200) throw new Error(`${label} status ${response?.status()}`);
    if(checks.scrollWidth>checks.innerWidth+1) throw new Error(`${label} horizontal overflow ${checks.scrollWidth}>${checks.innerWidth}`);
    if(checks.templateLength<1200||!checks.sampleVisible||!checks.checkoutVisible) throw new Error(`${label} content/CTA missing`);
    if(!checks.utmHref?.includes('utm_campaign=scope_proposal_intent_v1')) throw new Error(`${label} UTM path missing`);
    if(errors.length) throw new Error(`${label} JS errors: ${errors.join(' | ')}`);
    if(label==='desktop'){
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:()=>Promise.resolve()}}));
      await page.evaluate(() => document.getElementById('copy-template-button').click());
      await page.waitForFunction(() => document.getElementById('copy-template-button').textContent === 'Template copied');
      const copied=await page.locator('#copy-template-button').innerText();
      if(copied!=='Template copied') throw new Error(`copy feedback missing: ${copied}`);
    }
    const screenshot=path.join(out,`scope-of-work-guide-${label}.png`);
    await page.screenshot({path:screenshot,fullPage:true});
    results.push({label,status:response.status(),...checks,screenshot});
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify({url,results},null,2));
})().catch(error=>{console.error(error.stack||error);process.exit(1)});
