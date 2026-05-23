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
    throw new Error(`${name} should include ${JSON.stringify(expected)}, got ${JSON.stringify(value.slice(0, 360))}`);
  }
}

const buildWindow = text('#buildWindow');
assertIncludes('engagement blueprint heading', buildWindow, 'How the first useful loop starts');
assertIncludes('engagement blueprint step', buildWindow, '1. Workflow map');
assertIncludes('engagement blueprint step', buildWindow, '2. Safe first loop');
assertIncludes('engagement blueprint step', buildWindow, '3. Evidence dashboard');
assertIncludes('engagement blueprint copy', buildWindow, 'one contained workflow before scaling');
assertIncludes('engagement blueprint approval copy', buildWindow, 'Human approval stays in the path');

const blueprint = document.querySelector('#buildWindow .engagement-blueprint');
if (!blueprint) throw new Error('missing engagement blueprint container');
if (blueprint.querySelectorAll('article').length !== 3) {
  throw new Error('engagement blueprint should have exactly three scannable articles');
}

if (!/\.public-preview \.engagement-blueprint\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/.test(css)) {
  throw new Error('engagement blueprint should render as a three-column desktop grid');
}
if (!/\.public-preview \.engagement-blueprint\{grid-template-columns:1fr!important;\}/.test(css)) {
  throw new Error('engagement blueprint should collapse to one column in the existing mobile media query');
}

console.log('engagement-blueprint-regression ok');
