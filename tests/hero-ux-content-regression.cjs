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
    throw new Error(`${name} should include ${JSON.stringify(expected)}, got ${JSON.stringify(value.slice(0, 260))}`);
  }
}

const welcome = text('#readerWindow');
assertIncludes('welcome action panel', welcome, 'Book an AI systems chat');
assertIncludes('welcome action panel', welcome, 'See case-study buckets');
assertIncludes('welcome action panel', welcome, 'Start with AI Help');
assertIncludes('welcome outcome strip', welcome, 'Lead response');
assertIncludes('welcome outcome strip', welcome, 'Admin reduction');
assertIncludes('welcome outcome strip', welcome, 'Exception visibility');
assertIncludes('welcome proof steps', welcome, 'Map the workflow');
assertIncludes('welcome proof steps', welcome, 'Build the review loop');
assertIncludes('welcome proof steps', welcome, 'Measure the operating result');

const primaryCta = document.querySelector('.hero-action-panel a[href^="mailto:costea.michael@gmail.com"]');
if (!primaryCta) throw new Error('missing primary mailto CTA in hero action panel');

const contact = text('#contactWindow');
assertIncludes('contact brief', contact, 'What to send');
assertIncludes('contact brief', contact, 'the workflow or system that feels messy');
assertIncludes('contact brief', contact, 'what “better” would look like');

console.log('hero-ux-content-regression ok');
