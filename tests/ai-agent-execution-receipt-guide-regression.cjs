#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const {JSDOM}=require('/home/fiv30nit/.openclaw/workspace/node_modules/jsdom');
const root=path.resolve(__dirname,'..');
const pagePath=path.join(root,'guides/ai-agent-execution-receipt-template/index.html');
if(!fs.existsSync(pagePath)) throw new Error('missing AI agent execution receipt guide');
const html=fs.readFileSync(pagePath,'utf8');
const {document}=new JSDOM(html).window;
const body=document.body.textContent.replace(/\s+/g,' ').trim();
const attr=(selector,name)=>document.querySelector(selector)?.getAttribute(name)||'';
const guideUrl='https://michaelcostea.com/guides/ai-agent-execution-receipt-template/';
const landingUrl='../../safe-walk-away-agent-kit.html?utm_source=execution_receipt_guide&utm_medium=owned_content&utm_campaign=safe_walk_away_launch';
const checkoutUrl='https://costeamichael.gumroad.com/l/safe-walk-away-agent-kit/WALKAWAY5';
if(document.title!=='AI Agent Execution Receipt Template: Prove What Actually Ran') throw new Error(`unexpected title ${document.title}`);
if(attr('link[rel="canonical"]','href')!==guideUrl) throw new Error('wrong canonical');
if(attr('meta[name="robots"]','content')!=='index, follow') throw new Error('guide must be indexable');
if(attr('meta[name="description"]','content').length<120) throw new Error('meta description too short');
if(document.querySelectorAll('h1').length!==1||!body.includes('AI agents should prove what actually ran.')) throw new Error('guide H1 missing');
if(document.querySelectorAll('.state').length!==5) throw new Error('expected five execution states');
for(const phrase of [
  'Attempted','Executed','Verified','Failed','Blocked',
  'Machine-readable execution receipt.',
  'Was a real action executed?',
  'Static-site change with honest boundaries.',
  'Receipts improve review. They do not grant trust.',
  'Evidence aid, not a security boundary.',
  'US$5','WALKAWAY5','regular product price is US$19',
  'Applicable taxes are calculated by Gumroad.'
]) if(!body.includes(phrase)) throw new Error(`missing phrase: ${phrase}`);
const template=document.getElementById('receipt-template')?.textContent||'';
for(const field of ['"status"','"actions"','"verification"','"blocked"','"not_verified"','"external_changes"','"next_best_step"']) if(!template.includes(field)) throw new Error(`receipt field missing ${field}`);
const schema=JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
if(schema['@context']!=='https://schema.org'||!Array.isArray(schema['@graph'])) throw new Error('schema graph missing');
const article=schema['@graph'].find(item=>item['@type']==='Article');
const breadcrumbs=schema['@graph'].find(item=>item['@type']==='BreadcrumbList');
if(!article||article.mainEntityOfPage!==guideUrl||article.author?.name!=='Michael Costea'||article.datePublished!=='2026-07-22') throw new Error('Article schema incorrect');
if(!breadcrumbs||breadcrumbs.itemListElement?.length!==2) throw new Error('Breadcrumb schema incorrect');
const landingLinks=[...document.querySelectorAll('a[data-analytics-item-id="safe_walk_away_paid_landing"]')];
if(landingLinks.length!==3||landingLinks.some(link=>link.getAttribute('href')!==landingUrl||link.dataset.analyticsEvent!=='select_content')) throw new Error('qualified landing paths incorrect');
const checkoutLinks=[...document.querySelectorAll('a[data-analytics-event="begin_checkout"]')];
if(checkoutLinks.length!==2||checkoutLinks.some(link=>link.getAttribute('href')!==checkoutUrl||link.dataset.analyticsItemId!=='safe_walk_away_agent_kit')) throw new Error('checkout paths incorrect');
const measured=[...document.querySelectorAll('[data-analytics-event]')];
if(measured.length!==8||measured.some(element=>!element.dataset.analyticsItemId)) throw new Error(`analytics element contract incorrect: ${measured.length}`);
if(!html.includes('allow_google_signals: false')||!html.includes('allow_ad_personalization_signals: false')) throw new Error('analytics privacy flags missing');
for(const marker of ['/home/','.hermes/','localhost','127.0.0.1','TODO','FIXME','testimonial','customers bought']) if(html.toLowerCase().includes(marker.toLowerCase())) throw new Error(`private/dev/fake-proof marker leaked: ${marker}`);
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
if(!sitemap.includes(`<loc>${guideUrl}</loc>`)) throw new Error('sitemap missing guide');
if((sitemap.match(new RegExp(guideUrl.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length!==1) throw new Error('guide duplicated in sitemap');
const robots=fs.readFileSync(path.join(root,'robots.txt'),'utf8');
if(!robots.includes('User-agent: *')||!robots.includes('Allow: /')||!robots.includes('Sitemap: https://michaelcostea.com/sitemap.xml')) throw new Error('robots contract incorrect');
console.log('ai-agent-execution-receipt-guide-regression ok');
