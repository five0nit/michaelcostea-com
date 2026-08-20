#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;

function text(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`missing ${selector}`);
  return el.textContent.replace(/\s+/g, ' ').trim();
}
function attr(selector, name) {
  const value = document.querySelector(selector)?.getAttribute(name) || '';
  if (!value) throw new Error(`missing ${selector} ${name}`);
  return value;
}

if (document.querySelector('meta[name="robots"]')?.getAttribute('content')?.includes('noindex')) {
  throw new Error('live homepage must not keep preview noindex robots meta');
}
if (attr('link[rel="canonical"]', 'href') !== 'https://michaelcostea.com/') {
  throw new Error('live homepage canonical must point to root');
}
if (attr('meta[property="og:url"]', 'content') !== 'https://michaelcostea.com/') {
  throw new Error('live homepage og:url must point to root');
}
if (!document.body.classList.contains('ux-preview-page')) {
  throw new Error('live homepage should use the approved UX preview layout class');
}

for (const selector of ['#readerWindow', '#resumeWindow', '#projectsWindow', '#agentsWindow', '#aiHelpWindow', '.taskbar']) {
  if (!document.querySelector(selector)) throw new Error(`homepage missing promoted preview selector ${selector}`);
}

const homepageText = text('body');
for (const phrase of [
  'MICHAEL COSTEA',
  'I BUILD AI EMPLOYEES TO RUN THE BUSINESS WITH YOU.',
  'role-based AI employees for sales, operations, finance and support',
  'OPEN AI EMPLOYEE STACK',
  'Projects - Things I’ve Been Making',
  'Resume.doc - Michael Costea',
  'AI Employees - Agent Operations Stack',
]) {
  if (!homepageText.includes(phrase)) throw new Error(`live homepage missing preview content: ${phrase}`);
}

if (document.querySelector('#readerWindow [data-owned-path="freelancer-admin"]')) {
  throw new Error('homepage hero must not contain product/storefront promotion');
}
if (!document.querySelector('#resourcesWindow [data-owned-path="freelancer-admin"]')) {
  throw new Error('approved product plug should remain in the secondary Resources window');
}

console.log('homepage-live-promotion-regression ok');
