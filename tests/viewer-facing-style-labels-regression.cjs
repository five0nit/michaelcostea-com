#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const liveCss = fs.readFileSync(path.join(root, 'assets/css/hyperframes-live.css'), 'utf8');
const packBuilder = fs.readFileSync(path.join(root, 'demobuilds/business-agent-harness-pack/build_pack.cjs'), 'utf8');

function must(condition, message) {
  if (!condition) throw new Error(message);
}

must(homepage.includes('styles.css?v=20260821-mobile-home-readable'), 'homepage should cache-bust the current live stylesheet');
must(homepage.includes('hyperframes-live.css?v=20260821-mobile-home-readable'), 'homepage should cache-bust the cleaned live overlay stylesheet');

for (const visibleLabel of [
  'HYPERFRAME 01',
  'HYPERFRAME 02',
  'HYPERFRAME 03',
  'HYPERFRAME FULLSCREEN',
  'content:" // HF"',
  'content:"RESOURCE FRAME"',
  'content:"PROJECT FRAME"',
  'content:"AGENT FRAME"',
]) {
  must(!liveCss.includes(visibleLabel), `live stylesheet must not render viewer-facing label: ${visibleLabel}`);
}

must(!packBuilder.includes('MICHAELOS × NOUS × HYPERFRAMES'), 'Business Agent Harness pages must not render the internal style name');

console.log('viewer-facing-style-labels-regression ok');