#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const previewPath = path.join(rootDir, 'ai-value-preview.html');
const indexPath = path.join(rootDir, 'index.html');

if (!fs.existsSync(previewPath)) {
  throw new Error('missing ai-value-preview.html');
}

const previewHtml = fs.readFileSync(previewPath, 'utf8');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const dom = new JSDOM(previewHtml);
const { document } = dom.window;

function attr(selector, name) {
  const value = document.querySelector(selector)?.getAttribute(name) || '';
  if (!value) throw new Error(`missing ${selector} ${name}`);
  return value;
}

function pageText(doc) {
  return doc.body.textContent.replace(/\s+/g, ' ').trim();
}

if (!document.body.classList.contains('ai-value-preview-page')) {
  throw new Error('preview page must carry ai-value-preview-page body class');
}

if (attr('link[rel="canonical"]', 'href') !== 'https://michaelcostea.com/ai-value-preview.html') {
  throw new Error('preview page canonical must point at the preview URL');
}

if (!attr('meta[name="robots"]', 'content').includes('noindex')) {
  throw new Error('preview page should be noindex until Mike approves it for the main site');
}

if (!document.querySelector('.preview-ribbon')) {
  throw new Error('preview page should show a visible preview ribbon');
}

const text = pageText(document);
for (const phrase of [
  'HELPING PEOPLE GET MORE FROM AI',
  'I help people and businesses get the most out of AI',
  'How I help you get more out of AI',
  'Cut through the noise',
  'Find the right workflow',
  'Keep humans in control',
  '90-second AI value scan',
  'Practical AI Examples',
  'Send me the AI problem or messy workflow',
]) {
  if (!text.includes(phrase)) throw new Error(`preview page missing AI value positioning phrase: ${phrase}`);
}

const indexDom = new JSDOM(indexHtml);
const indexText = pageText(indexDom.window.document);
if (indexText.includes('HELPING PEOPLE GET MORE FROM AI')) {
  throw new Error('main index.html should not contain the preview hero headline yet');
}
if (indexDom.window.document.querySelector('meta[name="robots"]')?.getAttribute('content')?.includes('noindex')) {
  throw new Error('main index.html must not receive preview robots noindex');
}

console.log('ai-value-preview-page-regression ok');
