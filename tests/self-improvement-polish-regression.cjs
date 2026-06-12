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

assertMatch(
  'above-the-fold profile portrait should be preloaded with high fetch priority',
  /<link rel="preload" as="image" href="assets\/profile-michael-pixel\.jpg\?v=20260502-0415" fetchpriority="high" \/>/,
  html
);

assertMatch(
  'profile portrait should expose intrinsic dimensions to reduce layout shift',
  /<img src="assets\/profile-michael-pixel\.jpg\?v=20260502-0415"[^>]*width="1254"[^>]*height="1254"[^>]*fetchpriority="high"/,
  html
);

for (const [src, width, height] of [
  ['assets/minime-pack/ai_help_robot_highfive.png', 336, 291],
  ['assets/minime-pack/build_workflow_engineer.png', 331, 284],
  ['assets/minime-pack/contact_approval.png', 338, 378],
  ['assets/minime-pack/guide_documents.png', 289, 333],
]) {
  assertMatch(
    `${src} should expose intrinsic dimensions`,
    new RegExp(`<img src="${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*width="${width}"[^>]*height="${height}"`),
    html
  );
}

console.log('self-improvement-polish-regression ok');
