#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const {JSDOM}=require('/home/fiv30nit/.openclaw/workspace/node_modules/jsdom');
const root=path.resolve(__dirname,'..');
const file=path.join(root,'ai-automation-scope-proposal-kit.html');
if(!fs.existsSync(file)) throw new Error('missing landing page');
const html=fs.readFileSync(file,'utf8');
const {document}=new JSDOM(html).window;
const body=document.body.textContent.replace(/\s+/g,' ').trim();
const attr=(s,n)=>document.querySelector(s)?.getAttribute(n)||'';
const standard='https://costeamichael.gumroad.com/l/ai-automation-scope-to-proposal-kit';
const launch=`${standard}/SCOPE3`;
if(document.title!=='AI Automation Scope-to-Proposal Kit — six client drafts from one form') throw new Error(`unexpected title ${document.title}`);
if(attr('link[rel="canonical"]','href')!=='https://michaelcostea.com/ai-automation-scope-proposal-kit.html') throw new Error('wrong canonical');
if(attr('meta[name="robots"]','content')!=='index, follow') throw new Error('page must be indexable');
if(document.body.dataset.launchStatus!=='live') throw new Error('missing live status');
if(document.body.dataset.standardCheckoutUrl!==standard) throw new Error('wrong standard URL');
if(document.body.dataset.launchCheckoutUrl!==launch) throw new Error('wrong launch URL');
for(const phrase of ['AI Automation Scope-to-Proposal Kit','Turn a vague client call into a proposal you can defend.','US$12','US$3','Code SCOPE3','US$9 fixed discount','maximum 10 redemptions','before applicable taxes','Offline browser app','six reviewable client drafts','14-day description-match refund policy','No guaranteed ROI or outcome','Live · buyer checkout verified · ZIP delivery attached']) if(!body.includes(phrase)) throw new Error(`missing phrase: ${phrase}`);
const outputCards=[...document.querySelectorAll('main section:first-of-type .grid-3 .card')];
if(outputCards.length!==6) throw new Error(`expected six output cards, got ${outputCards.length}`);
const ctas=[...document.querySelectorAll('a.primary-cta')];
if(ctas.length!==2||ctas.some(a=>a.href!==launch)) throw new Error('all purchase CTAs must use verified SCOPE3 URL');
const support=attr('a.support-link','href');
if(!support.startsWith('mailto:costea.michael@gmail.com')) throw new Error('wrong support email');
for(const src of ['assets/products/ai-automation-scope-proposal-kit-cover.png','assets/products/ai-automation-scope-proposal-kit-app.png']){
 if(!fs.existsSync(path.join(root,src))) throw new Error(`missing asset ${src}`);
 const img=[...document.images].find(i=>i.getAttribute('src')===src);
 if(!img||!img.getAttribute('width')||!img.getAttribute('height')) throw new Error(`image dimensions missing ${src}`);
}
const schema=JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
if(schema['@type']!=='Product'||schema.offers.price!=='12.00'||schema.offers.priceCurrency!=='USD'||schema.offers.url!==standard) throw new Error('invalid product schema');
for(const marker of ['/home/','.hermes/','localhost','127.0.0.1','TODO','FIXME']) if(html.includes(marker)) throw new Error(`private/dev marker leaked: ${marker}`);
if(!html.includes('@media(max-width:720px)')) throw new Error('mobile breakpoint missing');
console.log('ai-automation-scope-proposal-kit-regression ok');
