#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const {JSDOM}=require('/home/fiv30nit/.openclaw/workspace/node_modules/jsdom');
const root=path.resolve(__dirname,'..');
const pagePath=path.join(root,'guides/freelancer-client-tracker/index.html');
if(!fs.existsSync(pagePath)) throw new Error('missing freelancer client tracker guide');
const html=fs.readFileSync(pagePath,'utf8');
const {document}=new JSDOM(html).window;
const body=document.body.textContent.replace(/\s+/g,' ').trim();
const attr=(selector,name)=>document.querySelector(selector)?.getAttribute(name)||'';
const guideUrl='https://michaelcostea.com/guides/freelancer-client-tracker/';
const landingUrl='../../freelancer-client-admin-starter-kit.html?utm_source=freelancer_client_tracker_guide&utm_medium=owned_content&utm_campaign=freelancer_admin_launch';
const productUrl='https://costeamichael.gumroad.com/l/freelancer-client-admin-starter-kit';
if(document.title!=='Freelancer Client Tracker: a simple lead-to-invoice spreadsheet workflow') throw new Error(`unexpected title ${document.title}`);
if(attr('link[rel="canonical"]','href')!==guideUrl) throw new Error('wrong canonical');
if(attr('meta[name="robots"]','content')!=='index, follow') throw new Error('guide must be indexable');
if(attr('meta[name="description"]','content').length<120) throw new Error('meta description too short');
if(document.querySelectorAll('h1').length!==1||!body.includes('A simple client tracker from first reply to paid invoice.')) throw new Error('guide H1 missing');
if(document.querySelectorAll('.step').length!==6) throw new Error('expected six workflow steps');
for(const phrase of [
  'Track the next decision—not every possible detail.',
  'Who needs a reply? What did we agree? What happens next?',
  'Write the scope outside chat',
  'Separate sent from paid',
  'Run a ten-minute weekly review',
  'When to move beyond a spreadsheet',
  'No guarantee of clients, payment, collection, compliance, revenue, or business outcome.',
  'US$5',
]) if(!body.includes(phrase)) throw new Error(`missing phrase: ${phrase}`);
const schema=JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
if(schema['@context']!=='https://schema.org'||!Array.isArray(schema['@graph'])) throw new Error('schema graph missing');
const article=schema['@graph'].find(item=>item['@type']==='Article');
const breadcrumbs=schema['@graph'].find(item=>item['@type']==='BreadcrumbList');
if(!article||article.mainEntityOfPage!==guideUrl||article.author?.name!=='Michael Costea'||article.datePublished!=='2026-07-20') throw new Error('Article schema incorrect');
if(!breadcrumbs||breadcrumbs.itemListElement?.length!==2) throw new Error('Breadcrumb schema incorrect');
const images=[...document.images];
if(images.length!==3||images.some(image=>!image.getAttribute('alt')||image.getAttribute('width')!=='1600'||image.getAttribute('height')!=='900')) throw new Error('guide image contract failed');
for(const src of images.map(image=>image.getAttribute('src'))){
  const file=path.resolve(path.dirname(pagePath),src);
  if(!fs.existsSync(file)) throw new Error(`missing guide image ${src}`);
}
const landing=document.querySelector('a[data-analytics-item-id="freelancer_client_admin_starter_kit_landing"]');
if(!landing||landing.getAttribute('href')!==landingUrl||landing.dataset.analyticsEvent!=='select_content') throw new Error('qualified landing path incorrect');
const checkout=[...document.querySelectorAll('a[data-analytics-event="begin_checkout"]')];
if(checkout.length!==2||checkout.some(link=>link.getAttribute('href')!==productUrl||link.dataset.analyticsItemId!=='freelancer_client_admin_starter_kit')) throw new Error('checkout path incorrect');
const resources=[...document.querySelectorAll('a[data-analytics-event="select_content"]')];
if(resources.length!==3||resources.some(link=>!link.dataset.analyticsItemId)) throw new Error('resource analytics contract incorrect');
if(!html.includes('allow_google_signals: false')||!html.includes('allow_ad_personalization_signals: false')) throw new Error('analytics privacy flags missing');
for(const marker of ['/home/','.hermes/','localhost','127.0.0.1','TODO','FIXME','testimonial','customers bought']) if(html.toLowerCase().includes(marker.toLowerCase())) throw new Error(`private/dev/fake-proof marker leaked: ${marker}`);
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
for(const url of ['https://michaelcostea.com/','https://michaelcostea.com/freelancer-client-admin-starter-kit.html',guideUrl,'https://michaelcostea.com/safe-walk-away-agent-kit.html']) if(!sitemap.includes(`<loc>${url}</loc>`)) throw new Error(`sitemap missing ${url}`);
if((sitemap.match(/<url>/g)||[]).length!==4) throw new Error('unexpected sitemap URL count');
const robots=fs.readFileSync(path.join(root,'robots.txt'),'utf8');
if(!robots.includes('User-agent: *')||!robots.includes('Allow: /')||!robots.includes('Sitemap: https://michaelcostea.com/sitemap.xml')) throw new Error('robots contract incorrect');
console.log('freelancer-client-tracker-guide-regression ok');
