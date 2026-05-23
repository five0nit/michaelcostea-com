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
  if (!value.includes(expected)) throw new Error(`${name} should include ${JSON.stringify(expected)}, got ${JSON.stringify(value.slice(0, 360))}`);
}

const demo = document.querySelector('.workflow-output-demo');
if (!demo) throw new Error('missing workflow-output-demo');

const demoText = text('.workflow-output-demo');
for (const expected of [
  'Workflows',
  'AI + Workflows',
  '4. Outputs',
  'Faster Growth',
  'Efficiency',
  'Better CX',
  'Clear Visibility',
  'Scale smarter, not heavier',
  'More output, less overhead.',
  '10:30 AM'
]) {
  assertIncludes('workflow output demo', demoText, expected);
}

if (document.querySelectorAll('.workflow-output-demo .output-row').length !== 4) {
  throw new Error('workflow output demo should include exactly four output rows');
}
if (!document.querySelector('.workflow-output-demo .connector-arrow')) {
  throw new Error('workflow output demo should include dotted connector arrow');
}
if (!/\.public-preview \.workflow-output-demo\{[^}]*background:#061b63/.test(css)) {
  throw new Error('workflow output demo should use dark blue app window background');
}
if (!/\.public-preview \.connector-arrow\{[^}]*border-top:4px dashed #38f7ff/.test(css)) {
  throw new Error('connector arrow should use dashed cyan styling');
}
if (!/\.public-preview \.output-row\{[^}]*border-radius:7px/.test(css)) {
  throw new Error('output rows should use rounded retro dark cards');
}
if (!/\.public-preview \.workflow-status-meter span/.test(css)) {
  throw new Error('workflow status meter segments should be styled');
}

console.log('workflow-output-reference-regression ok');
