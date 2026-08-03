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
  'HTML should cache-bust the MichaelOS motion CSS and JS deploy',
  /michaelos-motion\.css\?v=20260803-motion-6[\s\S]*script\.js\?v=20260803-michaelos-motion-7/,
  html
);

assertMatch(
  'above-the-fold profile portrait should be preloaded with high fetch priority',
  /<link rel="preload" as="image" href="assets\/profile-michael-pixel-os\.webp\?v=20260803-os-dither" fetchpriority="high" \/>/,
  html
);

assertMatch(
  'profile portrait should expose intrinsic dimensions to reduce layout shift',
  /<img src="assets\/profile-michael-pixel-os\.webp\?v=20260803-os-dither"[^>]*width="400"[^>]*height="400"[^>]*fetchpriority="high"/,
  html
);

for (const [src, width, height] of [
  ['assets/decks/intro-to-ai/slide-01.png?v=20260506-hd1', 1600, 900],
  ['assets/decks/hermes-agentic-framework-session/slide-01.png?v=20260701-presentation-preview-hd', 1600, 900],
]) {
  assertMatch(
    `${src} should stay deferred and expose intrinsic dimensions`,
    new RegExp(`<img[^>]*data-src="${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*width="${width}"[^>]*height="${height}"`),
    html
  );
}

console.log('self-improvement-polish-regression ok');
