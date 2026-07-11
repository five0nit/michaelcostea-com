#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const productionHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const previewPath = path.join(root, 'preview/content-audit/index.html');
if (!fs.existsSync(previewPath)) throw new Error('missing generated content-audit preview');

const previewHtml = fs.readFileSync(previewPath, 'utf8');
const production = new JSDOM(productionHtml).window.document;
const preview = new JSDOM(previewHtml).window.document;

function must(condition, message) {
  if (!condition) throw new Error(message);
}
function text(selector) {
  const node = preview.querySelector(selector);
  if (!node) throw new Error(`missing ${selector}`);
  return node.textContent.replace(/\s+/g, ' ').trim();
}

must(!production.body.classList.contains('content-audit-preview'), 'production root must remain unchanged by preview');
must(!production.querySelector('meta[name="robots"]')?.content.includes('noindex'), 'production root must remain indexable');
must(preview.body.classList.contains('content-audit-preview'), 'preview body class missing');
must(preview.querySelector('base')?.getAttribute('href') === '../../', 'preview base path should preserve root assets and scripts');
must(preview.querySelector('meta[name="robots"]')?.content === 'noindex,nofollow', 'preview must stay out of search results');
must(preview.querySelector('link[rel="canonical"]')?.href.includes('/preview/content-audit/'), 'preview canonical missing');
must(previewHtml.includes('preview/content-audit/preview.css?v=20260711-content-pass-2'), 'preview stylesheet missing');

const homeText = text('#readerWindow');
for (const phrase of [
  'FROM FRONTLINE OPERATIONS TO AI SYSTEMS',
  '352 stores',
  '5,000+ staff',
  'Licensed electrician',
  'Proof before promises',
]) must(homeText.includes(phrase), `preview homepage missing ${phrase}`);

must(preview.querySelectorAll('#readerWindow .welcome-sidebar .big-nav').length === 5, 'preview homepage should have five primary sidebar actions');
must(preview.querySelectorAll('#readerWindow .hero-action-panel .hero-image-cta').length === 3, 'preview homepage should have three primary image actions');

const resumeText = text('#resumeWindow');
must(!resumeText.toLowerCase().includes('cto-track'), 'preview Resume must remove self-awarded CTO-track language');
for (const phrase of ['What I Own Now', 'Selected Evidence', '352', '5,000+', '500,000', '74%']) {
  must(resumeText.includes(phrase), `preview Resume missing evidence: ${phrase}`);
}
must(preview.querySelectorAll('#resumeWindow .concise-capabilities .mini-content-card').length === 6, 'preview Resume should contain six concise capability cards');
must(preview.querySelectorAll('.win-window').length === production.querySelectorAll('.win-window').length, 'preview must preserve every functional window');
must(preview.querySelector('script[src^="script.js?v="]'), 'preview must preserve production script');

console.log('content-audit-preview-regression ok');
