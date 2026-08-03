#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/css/career-resume.css'),'utf8');
const document=new JSDOM(html).window.document;
const resume=document.querySelector('#resumeWindow');
if(!resume)throw new Error('missing #resumeWindow');
const clean=value=>(value||'').replace(/\s+/g,' ').trim();
const resumeText=clean(resume.textContent);
const must=(condition,message)=>{if(!condition)throw new Error(message)};

for(const phrase of [
  'AI Enablement Lead','AI Execution & Adoption Lead','Business Systems & Automation Lead','AI Transformation Manager',
  'Business Systems, Lead Flow & Digital Infrastructure — Expanded Scope','Mid-2023 - Present','Selected Operating Work',
  '84,400+','5,955','795','A$1.97M','251 h','124','459','735 h/year','A$47.8k/year','not claimed as AI-attributed revenue',
  'Pipedrive','simPRO','Microsoft Graph','n8n','Cloud Run','Vertical full-stack app delivery','Agent harness & model routing',
]) must(resumeText.includes(phrase),`inline resume missing current positioning: ${phrase}`);
for(const stale of ['Marketing Technology / Growth Systems Lead','4.3–4.5B','internal monthly harness throughput context']) must(!resumeText.includes(stale),`inline resume retains stale positioning: ${stale}`);
must(!resumeText.toLowerCase().includes('cto-track'),'resume must not use self-awarded CTO-track positioning');
must(resume.querySelectorAll('.career-fit-case').length===3,'inline resume must contain exactly three operating cases');
must(resume.querySelectorAll('.career-evidence-grid article').length===3,'inline resume must contain three primary outcomes');
must(resume.querySelectorAll('.career-action-evidence article').length===2,'inline resume must contain two secondary action proofs');
must(clean(resume.querySelector('.career-run-rate')?.textContent).includes('735 h/year · A$47.8k/year'),'inline annual run-rate metrics must be combined');

const pdfPath=path.join(root,'assets/downloads/Michael-Costea-Resume-2026.pdf');
must(fs.existsSync(pdfPath)&&fs.statSync(pdfPath).size>50000,'résumé PDF missing or too small');
const pdfText=clean(execFileSync('pdftotext',['-layout',pdfPath,'-'],{encoding:'utf8'}));
for(const phrase of ['AI Transformation Manager','84,400+','A$1.97M','251 h','Selected Delivery Evidence']) must(pdfText.toLowerCase().includes(phrase.toLowerCase()),`PDF missing current evidence: ${phrase}`);
for(const stale of ['4.3–4.5B','Codex Account Usage + Auth Rotator']) must(!pdfText.includes(stale),`PDF retains stale content: ${stale}`);

const printablePath=path.join(root,'assets/downloads/michael-costea-resume-2026.html');
must(fs.existsSync(printablePath),'ATS resume HTML source missing');
const printableHtml=fs.readFileSync(printablePath,'utf8');
const printableDocument=new JSDOM(printableHtml).window.document;
const printableText=clean(printableDocument.body.textContent);
for(const phrase of [
  'AI Transformation Manager','Recent Operating Evidence','84,400+','5,955','795','A$1.97M','251 h','124','459','A$47.8k',
  'AEH AI-enabled operating layer and commercial context','Job, finance and workflow-capacity automation','Optus knowledge, process and adoption operations',
  'Hermes Agent','OpenAI Codex and APIs','Anthropic Claude','Pipedrive','simPRO','Xero workflows','Microsoft Graph','Google Cloud Run',
]) must(printableText.includes(phrase),`printable resume missing current positioning: ${phrase}`);
must(printableDocument.querySelectorAll('.page').length===2,'printable resume must contain exactly two A4 pages');
must(printableDocument.querySelectorAll('.case').length===3,'printable resume must contain exactly three selected delivery cases');
must(printableDocument.querySelectorAll('.proof > div').length===5,'printable resume must contain exactly five evidence cards');
for(const stale of ['4.3–4.5B','Codex Account Usage + Auth Rotator','Automated Social & Brand Content Engine','Brief2Ship','RebateSignal']) must(!printableText.includes(stale),`printable resume retains product/throughput inventory: ${stale}`);

for(const marker of ['career-fit-summary','career-fit-grid','resume-download-row']) must(css.includes(`.${marker}`),`resume production CSS missing .${marker}`);
must(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'),'inline evidence grid must use three readable desktop columns');
must(html.includes('career-resume.css?v=20260804-proof-caveat-legibility'),'career stylesheet preview marker missing');
console.log('career-positioning-resume-regression ok');
