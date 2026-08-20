#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const {chromium}=require('/home/fiv30nit/.openclaw/workspace/node_modules/playwright');
const base=(process.env.PAGE_URL||'http://127.0.0.1:8157').replace(/\/$/,'');
const out=path.resolve(process.env.QA_OUT||'/tmp/michael-aeh-business-impact-preview');
fs.mkdirSync(out,{recursive:true});
const must=(value,message)=>{if(!value)throw new Error(message)};
const routes=[
  {slug:'resume',path:'/resume/',required:['84,400+','A$1.97M','AI Transformation Manager','ASSOCIATED ≠ CAUSED']},
  {slug:'projects',path:'/projects/',required:['AEH AI-enabled operating layer','Less double-handling','clearer ownership','faster follow-up']},
  {slug:'operating-layer',path:'/work/business-operating-layer/',required:['Day-to-day impact','Operational visibility','Adoption and handover','calmer operations']},
];
(async()=>{
  const browser=await chromium.launch({headless:true});
  const report={ok:true,base,viewports:[],pdf:{}};
  for(const [label,width,height,isMobile] of [['desktop',1440,1000,false],['mobile',390,844,true]]){
    const context=await browser.newContext({viewport:{width,height},isMobile,hasTouch:isMobile});
    const page=await context.newPage();
    await page.route('https://www.googletagmanager.com/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
    await page.route('https://www.google-analytics.com/**',route=>route.fulfill({status:204,body:''}));
    const errors=[];
    page.on('pageerror',error=>errors.push(`page:${error.message}`));
    page.on('console',message=>{if(message.type()==='error'&&!/favicon|ERR_BLOCKED_BY_CLIENT/.test(message.text()))errors.push(`console:${message.text()}`)});
    const viewportReport={label,width,height,routes:[]};
    const homeResponse=await page.goto(`${base}/`,{waitUntil:'networkidle'});
    must(homeResponse?.status()===200,`${label} homepage status ${homeResponse?.status()}`);
    const homeImpact=await page.evaluate(()=>{
      const hero=document.querySelector('#readerWindow .career-showcase-hero');
      const focus=document.querySelector('#readerWindow .career-operating-focus');
      const cards=[...document.querySelectorAll('#readerWindow .career-interest-grid article')];
      const clean=value=>(value||'').replace(/\s+/g,' ').trim();
      return {
        text:clean(hero?.textContent),
        focus:clean(focus?.textContent),
        proofCount:document.querySelectorAll('#readerWindow .career-proof-grid article').length,
        overflow:document.documentElement.scrollWidth-innerWidth,
        heroWidth:hero?.getBoundingClientRect().width??0,
        cards:cards.map(card=>({text:card.innerText,width:card.getBoundingClientRect().width})),
      };
    });
    must(homeImpact.focus.includes('Day job, briefly')&&homeImpact.focus.includes('All Electric Homes'),`${label} secondary day-job context missing: ${homeImpact.focus}`);
    must(homeImpact.text.includes('I MAKE USEFUL THINGS. SOME GET WEIRD.')&&homeImpact.text.includes('Device lab'),`${label} personal workshop hero missing`);
    must(homeImpact.proofCount===0,`${label} homepage metric proof grid returned`);
    must(homeImpact.overflow<=1,`${label} homepage horizontal overflow ${homeImpact.overflow}`);
    must(homeImpact.heroWidth>0&&homeImpact.cards.length===3&&homeImpact.cards.every(card=>card.width>0),`${label} homepage interest geometry invalid`);
    const homeImpactScreenshot=path.join(out,`home-workshop-${label}.png`);
    await page.locator('#readerWindow .career-showcase-hero').screenshot({path:homeImpactScreenshot});
    viewportReport.homeWorkshop={status:homeResponse.status(),focus:homeImpact.focus,overflow:homeImpact.overflow,screenshot:homeImpactScreenshot};
    for(const route of routes){
      const response=await page.goto(base+route.path,{waitUntil:'networkidle'});
      must(response?.status()===200,`${label} ${route.path} status ${response?.status()}`);
      const check=await page.evaluate(required=>({
        title:document.title,
        text:document.body.innerText,
        overflow:document.documentElement.scrollWidth-innerWidth,
        broken:[...document.images].filter(image=>image.complete&&image.naturalWidth===0).map(image=>image.getAttribute('src')),
        required:Object.fromEntries(required.map(term=>[term,document.body.innerText.toLowerCase().includes(term.toLowerCase())])),
        primaryTop:document.querySelector('.resume-primary')?.getBoundingClientRect().top??null,
        sidebarTop:document.querySelector('.resume-sidebar')?.getBoundingClientRect().top??null,
        primaryProofs:document.querySelectorAll('.resume-proof-impact > div').length,
        actionProofs:document.querySelectorAll('.resume-action-proof > div').length,
      }),route.required);
      must(check.overflow<=1,`${label} ${route.path} horizontal overflow ${check.overflow}`);
      must(!check.broken.length,`${label} ${route.path} broken images: ${check.broken}`);
      must(Object.values(check.required).every(Boolean),`${label} ${route.path} missing required content: ${JSON.stringify(check.required)}`);
      if(route.slug==='resume') must(check.primaryProofs===3&&check.actionProofs===2,`${label} resume evidence hierarchy ${check.primaryProofs}+${check.actionProofs}`);
      if(route.slug==='resume'&&label==='mobile') must(check.primaryTop<check.sidebarTop,`mobile resume sidebar precedes primary hiring narrative: ${check.primaryTop} !< ${check.sidebarTop}`);
      const screenshot=path.join(out,`${route.slug}-${label}.png`);
      await page.screenshot({path:screenshot,fullPage:true});
      viewportReport.routes.push({slug:route.slug,path:route.path,status:response.status(),title:check.title,overflow:check.overflow,screenshot});
    }
    await page.goto(`${base}/#resume`,{waitUntil:'networkidle'});
    await page.waitForSelector('#resumeWindow.open .selected-evidence');
    const evidence=page.locator('#resumeWindow .selected-evidence');
    await evidence.scrollIntoViewIfNeeded();
    const inlineEvidence=path.join(out,`inline-evidence-${label}.png`);
    await evidence.screenshot({path:inlineEvidence});
    viewportReport.inlineEvidence=inlineEvidence;
    must(errors.length===0,`${label} console errors: ${errors.join(' | ')}`);
    report.viewports.push(viewportReport);
    await context.close();
  }
  const api=await browser.newContext();
  const response=await api.request.get(`${base}/assets/downloads/Michael-Costea-Resume-2026.pdf`);
  const body=await response.body();
  report.pdf={status:response.status(),contentType:response.headers()['content-type']||'',bytes:body.length};
  must(response.status()===200,'PDF status failed');
  must(/pdf/i.test(report.pdf.contentType),'PDF content type wrong');
  must(body.length>50000,'PDF unexpectedly small');
  await api.close();
  fs.writeFileSync(path.join(out,'aeh-business-impact-browser-qa.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  await browser.close();
})().catch(error=>{console.error(error.stack||error);process.exit(1)});
