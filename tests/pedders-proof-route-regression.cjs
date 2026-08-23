#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const route = path.join(root, 'proof', 'pedders-technology-value-map');
const required = ['index.html', 'styles.css', 'app.mjs'];

for (const file of required) {
  const target = path.join(route, file);
  if (!fs.existsSync(target)) throw new Error(`missing public proof runtime file: ${file}`);
  if (fs.statSync(target).size === 0) throw new Error(`empty public proof runtime file: ${file}`);
}

const html = fs.readFileSync(path.join(route, 'index.html'), 'utf8');
for (const marker of [
  'Pedders · Head of Technology, AI and Systems · requisition 1365926766',
  'Public evidence · synthetic assumptions',
  'Not a Pedders product, audit, proposal or endorsement.',
  'noindex, nofollow',
  'https://michaelcostea.com/proof/pedders-technology-value-map/',
  'styles.css',
  'app.mjs',
]) {
  if (!html.includes(marker)) throw new Error(`missing employer-safe proof marker: ${marker}`);
}
if (/Local proof|localhost|127\.0\.0\.1|file:\/\//i.test(html)) throw new Error('local-only marker leaked into public proof');

const app = fs.readFileSync(path.join(route, 'app.mjs'), 'utf8');
if (!app.includes('export function calculateReadiness')) throw new Error('readiness contract missing');
if (!app.includes('export function scoreOpportunity')) throw new Error('opportunity scoring contract missing');
if (/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage/i.test(app)) throw new Error('unexpected network or persistence primitive in proof runtime');

console.log('pedders-proof-route-regression ok');
