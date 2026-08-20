#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const doc=(file)=>new JSDOM(read(file)).window.document;
const clean=(value)=>(value||'').replace(/\s+/g,' ').trim();
const must=(condition,message)=>{if(!condition)throw new Error(message)};

const index=doc('index.html');
const indexHtml=read('index.html');
const hero=clean(index.querySelector('#readerWindow .career-showcase-hero')?.textContent);
const heroSummary=clean(index.querySelector('#readerWindow .career-summary')?.textContent);
const inlineResume=clean(index.querySelector('#resumeWindow')?.textContent);
const crawlResume=doc('resume/index.html');
const crawlResumeText=clean(crawlResume.body.textContent);
const projects=doc('projects/index.html');
const projectsText=clean(projects.body.textContent);
const operatingCase=doc('work/business-operating-layer/index.html');
const operatingCaseText=clean(operatingCase.body.textContent);
const printable=doc('assets/downloads/michael-costea-resume-2026.html');
const printableText=clean(printable.body.textContent);

for(const phrase of ['built in real operations','all electric homes','sales','operations','finance','human approvals','receipts']) must(clean(index.querySelector('#readerWindow .career-operating-focus')?.textContent).toLowerCase().includes(phrase),`real-operations summary missing: ${phrase}`);
for(const forbidden of ['795','A$1.97M','251','EVIDENCE AS AT EARLY AUGUST 2026']) must(!hero.includes(forbidden),`hero retains metric-led proof: ${forbidden}`);
for(const phrase of ['role-based AI employees','sales, operations, finance and support','approval limits','escalation rules','proof of work']) must(heroSummary.includes(phrase),`first-screen agent-operations summary missing: ${phrase}`);
must(index.querySelectorAll('#readerWindow .career-interest-grid article').length===3,'homepage must show exactly three agent-system cards');
for(const phrase of ['AI Enablement Lead','AI Execution & Adoption Lead','Business Systems & Automation Lead','AI Transformation Manager']) must(inlineResume.includes(phrase),`inline resume missing AI-centric target: ${phrase}`);
for(const phrase of ['84,400+','5,955','795','A$1.97M','251','735']) must(inlineResume.includes(phrase),`inline resume missing AEH evidence: ${phrase}`);
must(index.querySelectorAll('#resumeWindow .career-evidence-grid article').length===3,'inline resume must show three primary outcome cards');
must(index.querySelectorAll('#resumeWindow .career-action-evidence article').length===2,'inline resume must show two secondary action-proof cards');
must(clean(index.querySelector('#resumeWindow .career-run-rate')?.textContent).includes('735 h/year · A$47.8k/year'),'inline resume must combine annual hours and value in one run-rate callout');

for(const phrase of ['84,400+','5,955','795','A$1.97M','251','735','associated pipeline','not claimed as AI-attributed revenue']) must(crawlResumeText.includes(phrase),`crawlable resume missing evidence/caveat: ${phrase}`);
must(crawlResumeText.includes('EVIDENCE AS AT EARLY AUGUST 2026'),'crawlable resume missing AEH evidence snapshot date');
must(crawlResume.querySelectorAll('.resume-proof-impact > div').length===3,'crawlable resume must show three primary outcome cards');
must(crawlResume.querySelectorAll('.resume-action-proof > div').length===2,'crawlable resume must show two secondary action-proof cards');
must(clean(crawlResume.querySelector('.resume-run-rate')?.textContent).includes('735 hours/year · A$47.8k/year'),'crawlable resume must combine annual run-rate evidence');
for(const phrase of ['AEH AI-enabled operating layer','Job, finance and workflow-capacity automation','Optus knowledge, process and adoption operations']) must(printableText.includes(phrase),`printable resume missing delivery case: ${phrase}`);
must(printable.querySelectorAll('.case').length===3,'printable resume must contain exactly three delivery-evidence cases');
must(printable.querySelectorAll('.page').length===2,'printable resume must remain two A4 pages');
must(printable.querySelectorAll('.proof > div').length===5,'printable resume must show exactly five recruiter-facing evidence cards');
must(JSON.stringify([...printable.querySelectorAll('.proof b')].map(node=>clean(node.textContent)))===JSON.stringify(['795','A$1.97M','251 h','124','459']),'printable evidence hierarchy must be 795, pipeline, capacity, simPRO and Xero');
for(const phrase of ['not independently reconciled issued or paid invoices or cash collected','Cumulative and annualised lenses are not additive']) must(printableText.includes(phrase),`printable resume missing explicit evidence boundary: ${phrase}`);

for(const surface of [projectsText,operatingCaseText]){
  for(const phrase of ['less double-handling','clearer ownership','faster follow-up']) must(surface.toLowerCase().includes(phrase),`business operating-layer surface missing qualitative impact: ${phrase}`);
  for(const metric of ['795','A$1.97M','251','84,400','A$47.8k']) must(!surface.includes(metric),`business operating-layer surface retains metric-led proof: ${metric}`);
}
for(const phrase of ['Day-to-day impact','Operational visibility','Adoption and handover','calmer operations']) must(operatingCaseText.includes(phrase),`deep operating case missing work-story framing: ${phrase}`);

for(const stale of ['4.3–4.5B','internal monthly harness throughput context']){
  must(!inlineResume.includes(stale),`inline resume retains stale token metric: ${stale}`);
  must(!crawlResumeText.includes(stale),`crawlable resume retains stale token metric: ${stale}`);
  must(!printableText.includes(stale),`printable resume retains stale token metric: ${stale}`);
}
for(const staleProject of ['Codex Account Usage + Auth Rotator','Automated Social & Brand Content Engine','Brief2Ship','RebateSignal']) must(!printableText.includes(staleProject),`printable resume retains product inventory: ${staleProject}`);
for(const forbidden of ['AI generated A$1.97M','A$1.97M generated by AI','84,400 tasks automated','459 verified invoices issued','A$47.8k cash saved']) must(![indexHtml,crawlResumeText,projectsText,operatingCaseText,printableText].join('\n').includes(forbidden),`unsupported public claim present: ${forbidden}`);

const pdf=path.join(root,'assets/downloads/Michael-Costea-Resume-2026.pdf');
must(fs.existsSync(pdf)&&fs.statSync(pdf).size>50000,'stable résumé PDF missing or unexpectedly small');
const pdfText=clean(execFileSync('pdftotext',['-layout',pdf,'-'],{encoding:'utf8'}));
for(const phrase of ['not independently reconciled issued or paid invoices or cash collected','Cumulative and annualised lenses are not additive']) must(pdfText.includes(phrase),`résumé PDF missing explicit evidence boundary: ${phrase}`);
console.log('aeh-business-impact-preview-regression ok');
