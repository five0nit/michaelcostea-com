#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pagePath = path.join(rootDir, 'tiny-menace.html');
const indexPath = path.join(rootDir, 'index.html');

function must(condition, message) {
  if (!condition) throw new Error(message);
}

must(fs.existsSync(pagePath), 'tiny-menace.html subpage should exist');
const page = fs.readFileSync(pagePath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');

for (const marker of [
  'Tiny Menace',
  'One tiny idiot. One deadly room. Sixty seconds.',
  'data-tool="barrier"',
  'data-tool="lure"',
  'data-tool="water"',
  'data-tool="bubble"',
  'fire touches explosive',
  'chain reaction',
  'startGame',
  'updateGoblinAI',
  'resolveEnvironmentalCombos',
]) {
  must(page.includes(marker), `missing page marker: ${marker}`);
}

must(/<meta name="robots" content="noindex, nofollow"\s*\/>/.test(page), 'subpage should be noindex while draft/prototype');
must(page.includes('href="/#projects"'), 'subpage should link back to MichaelOS projects');
must(index.includes('href="tiny-menace.html"'), 'homepage project showcase should link to Tiny Menace subpage');
must(index.includes('Tiny Menace'), 'homepage project showcase should mention Tiny Menace');

console.log('tiny-menace-subpage-regression ok');
