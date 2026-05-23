#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'ux-preview.html'), 'utf8');
const css = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;

function text(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`missing ${selector}`);
  return el.textContent.replace(/\s+/g, ' ').trim();
}
function assertIncludes(name, value, expected) {
  if (!value.includes(expected)) throw new Error(`${name} should include ${JSON.stringify(expected)}, got ${JSON.stringify(value.slice(0, 280))}`);
}

const landing = text('.mobile-retro-landing');
assertIncludes('mobile landing', landing, 'Michael Costea');
assertIncludes('mobile landing', landing, 'AI systems and workflow automation');
assertIncludes('mobile landing', landing, 'Book an AI systems chat');
assertIncludes('mobile landing', landing, 'View resume');
assertIncludes('mobile landing', landing, 'Projects');
assertIncludes('mobile landing', landing, 'Start with AI Help');
assertIncludes('mobile landing', landing, 'Lead response');
assertIncludes('mobile landing', landing, 'Admin reduction');
assertIncludes('mobile landing', landing, 'Exception visibility');

if (!document.querySelector('.mobile-retro-landing a[href^="mailto:costea.michael@gmail.com"]')) {
  throw new Error('mobile landing should include primary email CTA');
}

if (!/\.mobile-retro-landing\{[^}]*display:none/.test(css)) {
  throw new Error('mobile landing should be hidden by default on desktop');
}
if (!/body\.public-preview\.ux-preview-page\.mobile-mode #desktopRoot\{[^}]*display:none!important/.test(css)) {
  throw new Error('mobile mode should hide fake desktop shell');
}
if (!/body\.public-preview\.ux-preview-page\.mobile-mode \.taskbar\{[^}]*display:none!important/.test(css)) {
  throw new Error('mobile mode should hide fake OS taskbar');
}
if (!/body\.public-preview\.ux-preview-page\.mobile-mode #startMenu\{[^}]*display:none!important/.test(css)) {
  throw new Error('mobile mode should hide fake Start menu');
}
if (!/body\.public-preview\.ux-preview-page\.mobile-mode \.mobile-retro-landing\{[^}]*display:block!important/.test(css)) {
  throw new Error('mobile mode should show phone-first mobile landing');
}

console.log('phone-first-mobile-regression ok');
