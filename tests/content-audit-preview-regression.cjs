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
must(previewHtml.includes('preview/content-audit/preview.css?v=20260711-hireability-pass-4'), 'preview stylesheet missing');

const homeText = text('#readerWindow');
for (const phrase of [
  'I BUILD AGENT SYSTEMS THAT SURVIVE REAL WORK',
  'AGENTIC SYSTEMS LEAD',
  '441 tests',
  '6 transports',
  'Proof before promises',
  'Three builds. Problem, architecture, proof.',
  'AgentMesh',
  'Telegram Agent Office',
  'Business Agent Harness',
  'First 90 days',
]) must(homeText.includes(phrase), `preview homepage missing ${phrase}`);

must(preview.querySelectorAll('#readerWindow .welcome-sidebar .big-nav').length === 6, 'preview homepage should have six primary sidebar actions');
must(preview.querySelectorAll('#readerWindow .hero-action-panel .hero-image-cta').length === 3, 'preview homepage should have three primary image actions');
must(preview.querySelectorAll('#readerWindow .agent-case-study').length === 3, 'homepage should show three proof-led agent case studies');
must(preview.querySelectorAll('#readerWindow .first-90-days li').length === 4, 'homepage should show four first-90-day ownership steps');
must(preview.querySelector('#readerWindow a[href="https://github.com/five0nit/telegram-office"]'), 'Agent Office public repo proof link missing');
must(preview.querySelector('#readerWindow a[href*="business-agent-harness-pack.zip"]'), 'Business Agent Harness download missing');

const resumeText = text('#resumeWindow');
must(!resumeText.toLowerCase().includes('cto-track'), 'preview Resume must remove self-awarded CTO-track language');
for (const phrase of ['What I Own Now', 'Operating Evidence', 'Selected Agentic Work', 'Agentic Engineering Scope', 'PRODUCT SCOPE', 'TELEMETRY TRUTH', 'IMPLEMENTATION MODEL', 'AgentMesh', 'Telegram Agent Office', 'Business Agent Harness', '352', '5,000+', '500,000']) {
  must(resumeText.includes(phrase), `preview Resume missing evidence: ${phrase}`);
}
must(preview.querySelectorAll('#resumeWindow .concise-capabilities .mini-content-card').length === 6, 'preview Resume should contain six concise capability cards');
must(preview.querySelectorAll('#resumeWindow .resume-agentic-grid article').length === 6, 'preview Resume should contain six agentic practice cards');
must(preview.querySelectorAll('#resumeWindow .resume-case').length === 3, 'preview Resume should contain three agentic case studies');
must(preview.querySelector('#resumeWindow a[href="https://github.com/five0nit/telegram-office"]'), 'Resume Agent Office repo link missing');
must(preview.querySelector('#resumeWindow a[href*="business-agent-harness-pack.zip"]'), 'Resume harness download link missing');
must(preview.querySelectorAll('.win-window').length === production.querySelectorAll('.win-window').length, 'preview must preserve every functional window');
must(preview.querySelector('script[src^="script.js?v="]'), 'preview must preserve production script');

console.log('content-audit-preview-regression ok');
