#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const rootHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const variants = [1, 2].map(number => {
  const dir = path.join(root, 'preview', `retro-animation-${number}`);
  return {
    number,
    html: fs.readFileSync(path.join(dir, 'index.html'), 'utf8'),
    css: fs.readFileSync(path.join(dir, 'styles.css'), 'utf8'),
    js: fs.readFileSync(path.join(dir, 'app.js'), 'utf8'),
  };
});
for (const variant of variants) {
  assert.match(variant.html, /meta name="robots" content="noindex,nofollow"/);
  assert.match(variant.html, new RegExp(`https://michaelcostea\\.com/preview/retro-animation-${variant.number}/`));
  assert.match(variant.html, /data-replay/);
  assert.match(variant.html, new RegExp(`retro-animation-${variant.number === 1 ? 2 : 1}`));
  assert.match(variant.css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(variant.js, /__RETRO_VARIANT_READY__=true/);
  assert.match(variant.js, new RegExp(`variant:${variant.number}`));
  assert.doesNotMatch(variant.html + variant.css + variant.js, /unpkg\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/);
}
assert.match(variants[0].html, /MichaelOS wakes up|RIGHT\. LET’S BUILD IT/);
assert.equal((variants[0].html.match(/class="agent agent-/g) || []).length, 7);
assert.match(variants[0].html, /https:\/\/minimemichael\.web\.app\/mini-assets\/v2\/v2-019\.png/);
assert.match(variants[0].html, /HUMAN IN CONTROL[\s\S]*AGENTS AT WORK/);
assert.equal((variants[1].html.match(/class="crash-window/g) || []).length, 6);
assert.match(variants[1].html, /MICHAEL[\s\S]*COSTEA/);
assert.match(variants[1].js, /for\(let i=0;i<56;i\+\+\)/);
assert.match(variants[1].html, /AI THAT LEAVES THE DEMO[\s\S]*AND ENTERS THE BUSINESS/);
assert.doesNotMatch(rootHtml, /retro-animation-1|retro-animation-2|VARIANT 01 · MINI STORY|VARIANT 02 · TITLE CRASH/);
console.log(JSON.stringify({ variants: 2, routes: ['/preview/retro-animation-1/', '/preview/retro-animation-2/'], rootContaminated: false }, null, 2));
