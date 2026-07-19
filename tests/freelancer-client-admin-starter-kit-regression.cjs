#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const {JSDOM}=require('/home/fiv30nit/.openclaw/workspace/node_modules/jsdom');
const root=path.resolve(__dirname,'..');
const file=path.join(root,'freelancer-client-admin-starter-kit.html');
if(!fs.existsSync(file)) throw new Error('missing landing page');
const html=fs.readFileSync(file,'utf8');
const {document}=new JSDOM(html).window;
const body=document.body.textContent.replace(/\s+/g,' ').trim();
const attr=(s,n)=>document.querySelector(s)?.getAttribute(n)||'';
const product='https://costeamichael.gumroad.com/l/freelancer-client-admin-starter-kit';
if(document.title!=='Freelancer Client Admin Starter Kit — lead, project & invoice trackers') throw new Error(`unexpected title ${document.title}`);
if(attr('link[rel="canonical"]','href')!=='https://michaelcostea.com/freelancer-client-admin-starter-kit.html') throw new Error('wrong canonical');
if(attr('meta[name="robots"]','content')!=='index, follow') throw new Error('page must be indexable');
if(document.body.dataset.launchStatus!=='live') throw new Error('missing live status');
if(document.body.dataset.standardCheckoutUrl!==product) throw new Error('wrong product URL');
for(const phrase of [
  'Know who needs a reply, what you promised, and what is still unpaid.',
  'US$5',
  'one-time product price before applicable taxes',
  '15 FILES',
  '10-MIN SETUP',
  'NO SUBSCRIPTION',
  'NO MACROS',
  'Client-admin XLSX dashboard',
  'Five Markdown templates',
  'Three blank CSV imports',
  'No client or payment guarantee',
  'No accounting, tax, or legal advice',
  'Live · buyer checkout verified · customer ZIP attached',
  'Get the admin kit — US$5',
]) if(!body.includes(phrase)) throw new Error(`missing phrase: ${phrase}`);
const cards=[...document.querySelectorAll('.workflow-card')];
if(cards.length!==4) throw new Error(`expected four workflow cards, got ${cards.length}`);
const ctas=[...document.querySelectorAll('a.primary-cta')];
if(ctas.length!==2||ctas.some(a=>a.href!==product)) throw new Error('all purchase CTAs must use verified product URL');
const support=attr('a.support-link','href');
if(!support.startsWith('mailto:costea.michael@gmail.com')) throw new Error('wrong support email');
for(const src of [
  'assets/products/freelancer-client-admin-cover.png',
  'assets/products/freelancer-client-admin-dashboard.png',
  'assets/products/freelancer-client-admin-trackers.png',
]){
  if(!fs.existsSync(path.join(root,src))) throw new Error(`missing asset ${src}`);
  const img=[...document.images].find(i=>i.getAttribute('src')===src);
  if(!img||img.getAttribute('width')!=='1600'||img.getAttribute('height')!=='900'||!img.getAttribute('alt')) throw new Error(`image contract failed ${src}`);
}
const sample=attr('a.sample-cta','href');
if(sample!=='downloads/freelancer-client-admin-setup-checklist.md'||!fs.existsSync(path.join(root,sample))) throw new Error('missing setup checklist');
const sampleText=fs.readFileSync(path.join(root,sample),'utf8');
if(!sampleText.includes('Operational checklist only.')||!sampleText.includes(product)) throw new Error('setup checklist boundary/CTA missing');
const shortRoute=path.join(root,'freelancer-admin/index.html');
if(!fs.existsSync(shortRoute)) throw new Error('missing memorable route');
if(!fs.readFileSync(shortRoute,'utf8').includes('https://michaelcostea.com/freelancer-client-admin-starter-kit.html')) throw new Error('short route destination wrong');
const analyticsScript=[...document.scripts].find(s=>s.src.includes('googletagmanager.com/gtag/js?id=G-C0YHGXH33P'));
if(!analyticsScript) throw new Error('privacy-limited analytics loader missing');
if(!html.includes('allow_google_signals: false')||!html.includes('allow_ad_personalization_signals: false')) throw new Error('analytics privacy flags missing');
if(ctas.some(a=>a.dataset.analyticsEvent!=='begin_checkout')) throw new Error('purchase CTAs must emit begin_checkout');
if(document.querySelector('a.sample-cta')?.dataset.analyticsEvent!=='select_content') throw new Error('sample CTA must emit select_content');
if(!html.includes("item_id: 'freelancer_client_admin_starter_kit'")||!html.includes("item_id: 'freelancer_client_admin_setup_checklist'")) throw new Error('analytics item IDs missing');
const homepageHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
const homepage=new JSDOM(homepageHtml).window.document;
const ownedPath=homepage.querySelector('a[data-owned-path="freelancer-admin"]');
const expectedOwnedPath='freelancer-admin/?utm_source=michaelcostea.com&utm_medium=owned_homepage&utm_campaign=freelancer_admin_launch';
if(!ownedPath||ownedPath.getAttribute('href')!==expectedOwnedPath||ownedPath.textContent.trim()!=='Open the US$5 kit') throw new Error('qualified homepage path missing or incorrect');
const schema=JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
if(schema['@context']!=='https://schema.org'||schema['@type']!=='Product'||schema.offers.price!=='5.00'||schema.offers.priceCurrency!=='USD'||schema.offers.url!==product) throw new Error('invalid product schema');
for(const marker of ['/home/','.hermes/','localhost','127.0.0.1','TODO','FIXME','testimonial','customers bought']) if(html.toLowerCase().includes(marker.toLowerCase())) throw new Error(`private/dev/fake-proof marker leaked: ${marker}`);
if(!html.includes('@media(max-width:720px)')) throw new Error('mobile breakpoint missing');
console.log('freelancer-client-admin-starter-kit-regression ok');
