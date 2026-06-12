#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(rootDir, 'script.js'), 'utf8');

function assertMatch(name, regex, source) {
  if (!regex.test(source)) throw new Error(`${name} missing. Pattern: ${regex}`);
}

assertMatch(
  'ui beeps should wait for a real user activation to avoid autoplay AudioContext warnings on route loads',
  /function uiBeep\(kind='tap'\)\{[\s\S]*navigator\.userActivation\?\.hasBeenActive[\s\S]*new \(window\.AudioContext\|\|window\.webkitAudioContext\)\(\)/,
  js
);

assertMatch(
  'mobile resume header links should have touch-sized tap targets',
  /body\.mobile-mode \.doc-header a\{[\s\S]*display:inline-flex[\s\S]*min-height:32px[\s\S]*padding:4px 2px/s,
  css
);

assertMatch(
  'HTML should cache-bust both CSS and JS for self-improvement polish deploy',
  /styles\.css\?v=20260612-self-improve-1[\s\S]*script\.js\?v=20260612-self-improve-1/,
  html
);

console.log('self-improvement-polish-regression ok');
