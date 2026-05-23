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
assertIncludes('welcome quick fit', welcome, 'Best fit');
assertIncludes('welcome quick fit', welcome, 'service business workflows');
assertIncludes('welcome quick fit', welcome, 'Not a fit');
assertIncludes('welcome quick fit', welcome, 'unsupervised customer-impacting AI');

const contact = text('#contactWindow');
assertIncludes('contact qualification', contact, 'Good reasons to reach out');
assertIncludes('contact qualification', contact, 'Not the right fit');
assertIncludes('contact qualification', contact, 'no unsupervised customer messages');
assertIncludes('contact next step', contact, 'Next step: send the workflow in plain English');

const mailto = document.querySelector('#contactWindow a[href^="mailto:costea.michael@gmail.com"]')?.getAttribute('href') || '';
assertIncludes('contact mailto body', decodeURIComponent(mailto), 'Best fit / not sure because:');
assertIncludes('contact mailto body', decodeURIComponent(mailto), 'Risk or approval needed:');

const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent));
const person = jsonLd.find((item) => item['@type'] === 'Person');
if (!person) throw new Error('missing Person JSON-LD');
assertIncludes('Person JSON-LD name', person.name || '', 'Michael Costea');
assertIncludes('Person JSON-LD jobTitle', person.jobTitle || '', 'Head of Tech');
assertIncludes('Person JSON-LD description', person.description || '', 'AI-powered business operating systems');

console.log('contact-conversion-regression ok');
