#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'ux-preview.html'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;

function text(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`missing ${selector}`);
  return el.textContent.replace(/\s+/g, ' ').trim();
}

function assertIncludes(name, value, expected) {
  if (!value.includes(expected)) {
    throw new Error(`${name} should include ${JSON.stringify(expected)}, got ${JSON.stringify(value.slice(0, 320))}`);
  }
}

const welcome = text('#readerWindow');
assertIncludes('workflow scan section', welcome, '90-second workflow scan');
assertIncludes('workflow scan question', welcome, 'Where does the request start?');
assertIncludes('workflow scan question', welcome, 'Who owns the next action?');
assertIncludes('workflow scan question', welcome, 'What evidence proves it happened?');
assertIncludes('workflow scan cta', welcome, 'Open the workflow scan');

const scanCta = document.querySelector('.workflow-scan-card a[href^="mailto:costea.michael@gmail.com"]');
if (!scanCta) throw new Error('missing workflow scan mailto CTA');
const href = decodeURIComponent(scanCta.getAttribute('href'));
assertIncludes('workflow scan mailto subject', href, '90-second workflow scan');
assertIncludes('workflow scan mailto prompt', href, 'Where the request starts:');
assertIncludes('workflow scan mailto prompt', href, 'What evidence proves it happened:');

console.log('workflow-scan-ux-regression ok');
