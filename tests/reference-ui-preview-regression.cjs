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
  if (!value.includes(expected)) {
    throw new Error(`${name} should include ${JSON.stringify(expected)}, got ${JSON.stringify(value.slice(0, 320))}`);
  }
}

const panel = document.querySelector('.reference-ui-panel');
if (!panel) throw new Error('missing reference-ui-panel');

const panelText = text('.reference-ui-panel');
for (const label of ['SALES', 'OPS', 'FINANCE', 'ADMIN', 'FIELD']) {
  assertIncludes('reference nav labels', panelText, label);
}
assertIncludes('reference headline', panelText, 'SCALABLE WORKFLOW SYSTEMS');
assertIncludes('reference subtitle', panelText, 'Connected systems for leads, ops, finance, admin, and field delivery.');
assertIncludes('reference taskbar', panelText, 'Start');
assertIncludes('reference address bar', panelText, 'michaelcostea.com/ux-preview');

if (!/\.public-preview \.reference-ui-panel\{[^}]*background:#c0c0c0/.test(css)) {
  throw new Error('reference ui panel should use Windows gray outer chrome');
}
if (!/\.public-preview \.reference-ui-main\{[^}]*#001b66/.test(css)) {
  throw new Error('reference ui main should use deep blue dashboard background');
}
if (!/clip-path:polygon\(24px 0,100% 0,100% 100%,24px 100%,0 calc\(100% - 24px\),0 24px\)/.test(css)) {
  throw new Error('reference hud panel should use chamfered clipped corners');
}

console.log('reference-ui-preview-regression ok');
