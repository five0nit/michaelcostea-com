#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;

function meta(selector) {
  return document.querySelector(selector)?.getAttribute('content')?.trim() || '';
}

function assertIncludes(name, value, expected) {
  if (!value.includes(expected)) {
    throw new Error(`${name} should include ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
  }
}

function assertUrl(name, value) {
  if (!/^https:\/\/michaelcostea\.com\/?/.test(value)) {
    throw new Error(`${name} should point at michaelcostea.com, got ${JSON.stringify(value)}`);
  }
}

const title = document.querySelector('title')?.textContent?.trim() || '';
assertIncludes('title', title, 'Michael Costea');
assertIncludes('title', title, 'useful AI, weird projects & old devices');
assertIncludes('description', meta('meta[name="description"]'), 'weird little workshop');

assertIncludes('og:title', meta('meta[property="og:title"]'), 'Michael Costea');
assertIncludes('og:title', meta('meta[property="og:title"]'), 'useful AI, weird projects & old devices');
assertIncludes('og:description', meta('meta[property="og:description"]'), 'weird little workshop');
assertUrl('og:url', meta('meta[property="og:url"]'));
assertIncludes('og:image', meta('meta[property="og:image"]'), 'assets/social/michael-costea-head-of-tech.png');

assertIncludes('twitter:card', meta('meta[name="twitter:card"]'), 'summary_large_image');
assertIncludes('twitter:title', meta('meta[name="twitter:title"]'), 'Michael Costea');
assertIncludes('twitter:description', meta('meta[name="twitter:description"]'), 'plain-English AI help without the theatre');

console.log('head-metadata-regression ok');
