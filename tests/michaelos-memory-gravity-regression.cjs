#!/usr/bin/env node
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const route = path.join(root, 'preview', 'michaelos-memory-gravity');
const html = readFileSync(path.join(route, 'index.html'), 'utf8');
const css = readFileSync(path.join(route, 'styles.css'), 'utf8');
const js = readFileSync(path.join(route, 'app.js'), 'utf8');
const readme = readFileSync(path.join(route, 'README.md'), 'utf8');

for (const file of ['index.html', 'styles.css', 'app.js', 'README.md']) {
  assert.equal(existsSync(path.join(route, file)), true, `missing ${file}`);
}

assert.match(html, /<meta name="robots" content="noindex,nofollow"/);
assert.match(html, /id="data-field"/);
assert.match(html, /BOOT[\s\S]*MAP[\s\S]*ORCHESTRATE[\s\S]*PROVE[\s\S]*SHIP/);
assert.match(html, /id="replay-button"/);
assert.match(html, /id="pause-button"[^>]*aria-pressed="false"/);
assert.match(html, /id="sources-dialog"/);
assert.match(html, /https:\/\/dribbble\.com\/shots\/popular/);
assert.match(html, /https:\/\/codepen\.io\/trending/);
assert.match(html, /https:\/\/codepen\.io\/VoXelo\/pen\/VYKMNwE/);
assert.match(html, /https:\/\/michaelcostea\.com/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(css, /--desktop:\s*#003f84/);
assert.match(css, /HYPERFRAME 04 · OPERATOR SURFACE/);
assert.match(js, /requestAnimationFrame/);
assert.match(js, /seededRandom/);
assert.match(js, /window\.__MEMORY_GRAVITY_READY__ = true/);
assert.match(js, /prefers-reduced-motion: reduce/);
assert.match(js, /BOOT[\s\S]*MAP[\s\S]*ORCHESTRATE[\s\S]*PROVE[\s\S]*SHIP/);
assert.doesNotMatch(html + css + js, /https:\/\/unpkg\.com|https:\/\/cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/);
assert.match(readme, /No external library, copied Pen source, copied artwork, or production-root mutation/);

console.log(JSON.stringify({
  route: '/preview/michaelos-memory-gravity/',
  files: 4,
  externalRuntimeDependencies: 0,
  phases: 5,
  reducedMotion: true,
}, null, 2));
