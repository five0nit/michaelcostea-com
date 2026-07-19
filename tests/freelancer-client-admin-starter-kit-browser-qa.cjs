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
    overflow:document.documentElement.scrollWidth>innerWidth,
    width:innerWidth,
    scrollWidth:document.documentElement.scrollWidth,
    images:[...document.images].map(i=>({src:i.getAttribute('src'),naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,displayWidth:i.getBoundingClientRect().width,right:i.getBoundingClientRect().right,alt:i.getAttribute('alt')})),
  }));
  if(metrics.overflow) throw new Error(`${name}: horizontal overflow ${metrics.scrollWidth}>${metrics.width}`);
  if(metrics.status!=='live'||!metrics.h1||!metrics.cta) throw new Error(`${name}: hero/status missing`);
  if(metrics.href!=='https://costeamichael.gumroad.com/l/freelancer-client-admin-starter-kit') throw new Error(`${name}: bad CTA`);
  if(metrics.images.length!==3||metrics.images.some(i=>!i.naturalWidth||i.right>metrics.width+.5||i.displayWidth<=0||!i.alt)) throw new Error(`${name}: image load/fit/alt failed ${JSON.stringify(metrics.images)}`);
  if(errors.length) throw new Error(`${name}: console errors ${errors.join(' | ')}`);
  await page.screenshot({path:path.join(out,`freelancer-client-admin-starter-kit-${name}.png`),fullPage:true});
  console.log(JSON.stringify({viewport:name,...metrics,consoleErrors:0}));
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
