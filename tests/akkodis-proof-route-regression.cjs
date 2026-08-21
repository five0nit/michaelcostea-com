#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const route = path.join(root, 'proof', 'akkodis-copilot-adoption-studio');
const required = ['index.html', 'styles.css', 'app.mjs'];

for (const file of required) {
  const target = path.join(route, file);
  if (!fs.existsSync(target)) throw new Error(`missing public proof runtime file: ${file}`);
  if (fs.statSync(target).size === 0) throw new Error(`empty public proof runtime file: ${file}`);
}

const html = fs.readFileSync(path.join(route, 'index.html'), 'utf8');
for (const marker of [
  'Akkodis × Copilot Adoption Specialist · JN-082026-18796',
  'Independent proof · synthetic data',
  'Not an Akkodis product, engagement or endorsement.',
  'styles.css',
  'app.mjs',
]) {
  if (!html.includes(marker)) throw new Error(`missing employer-safe proof marker: ${marker}`);
}
if (/Local proof · synthetic data/i.test(html)) throw new Error('stale local-only publication label remains');
if (/localhost|127\.0\.0\.1|file:\/\//i.test(html)) throw new Error('local-only URL leaked into public proof');

const app = fs.readFileSync(path.join(route, 'app.mjs'), 'utf8');
if (!app.includes('export function calculateModel')) throw new Error('proof calculator contract missing');
if (/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/i.test(app)) throw new Error('unexpected external-request primitive in proof runtime');

console.log('akkodis-proof-route-regression ok');
