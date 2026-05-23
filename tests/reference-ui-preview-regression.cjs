#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'ux-preview.html'), 'utf8');
const css = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;

const removedSelectors = [
  '.reference-ui-panel',
  '.reference-address-bar',
  '.reference-ui-main',
  '.reference-nav',
  '.reference-hud-card',
  '.reference-taskbar',
];

for (const selector of removedSelectors) {
  if (document.querySelector(selector)) {
    throw new Error(`${selector} should be removed from ux-preview.html`);
  }
}

const removedCopy = [
  'SCALABLE WORKFLOW SYSTEMS',
  'Connected systems for leads, ops, finance, admin, and field delivery.',
];
for (const copy of removedCopy) {
  if (html.includes(copy)) {
    throw new Error(`removed reference panel copy still appears: ${copy}`);
  }
}

for (const selector of removedSelectors) {
  const escaped = selector.replace('.', '\\.');
  if (new RegExp(escaped).test(css)) {
    throw new Error(`${selector} styles should be removed from styles.css`);
  }
}

console.log('reference-ui-preview-removal-regression ok');
