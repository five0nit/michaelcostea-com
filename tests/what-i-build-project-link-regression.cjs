#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');
const { document } = new JSDOM(html).window;
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

const popout = document.querySelector('#buildWindow a.build-projects-popout[href="projects/"]');
if (!popout) throw new Error('What I Build needs a direct project-library popout link');

const popoutText = clean(popout.textContent);
for (const phrase of ['Project library', 'View all 19 projects', 'Live products', 'inspectable delivery proof']) {
  if (!popoutText.includes(phrase)) throw new Error(`project popout missing: ${phrase}`);
}

if (popout.getAttribute('aria-label') !== 'View all 19 projects') {
  throw new Error('project popout needs an exact accessible label');
}
if (document.querySelectorAll('#buildWindow a[href="projects/"]').length !== 1) {
  throw new Error('What I Build should contain one unambiguous direct projects link');
}
if (!document.querySelector('#buildWindow .build-projects-cta button[data-open="projectsWindow"]')) {
  throw new Error('MichaelOS projects-window action must remain available');
}
const buildFigure = document.querySelector('#buildWindow .site-art-card');
if (!(popout.compareDocumentPosition(buildFigure) & 4)) {
  throw new Error('project popout must appear before the large What I Build artwork');
}

for (const marker of [
  '.public-preview .build-projects-popout{',
  'box-shadow:4px 4px 0 #000',
  '.public-preview .build-projects-popout:hover',
  '.public-preview .build-projects-popout:focus-visible',
]) {
  if (!css.includes(marker)) throw new Error(`project popout CSS missing: ${marker}`);
}

console.log('what-i-build-project-link-regression ok');
