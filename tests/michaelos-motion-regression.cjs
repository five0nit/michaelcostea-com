#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/michaelos-motion.css'), 'utf8');
const sprite = fs.readFileSync(path.join(root, 'assets/icons/michaelos-sprite.svg'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;
const must = (condition, message) => { if (!condition) throw new Error(message); };

must(document.querySelector('link[href*="michaelos-motion.css?v=20260803-motion-6"]'), 'final motion stylesheet missing');
must(document.querySelector('script[src*="script.js?v=20260803-michaelos-motion-6"]'), 'motion script cache marker missing');

const desktopIcons = [...document.querySelectorAll('.desktop-icons .desk-icon')];
must(desktopIcons.length === 11, `expected 11 desktop icons, got ${desktopIcons.length}`);
must(desktopIcons.every(icon => icon.querySelector('svg.os-icon use[href*="michaelos-sprite.svg#icon-"]')), 'desktop icons must use deterministic sprite symbols');
must(!document.querySelector('.desktop-icons .icon-art'), 'platform emoji icon layer must be removed from desktop');
for (const id of ['computer','document','puzzle','folder','robot','package','bolt','toolbox','education','intake','recycle','sound-on','sound-off','restart','motion']) {
  must(sprite.includes(`id="icon-${id}"`), `sprite missing icon-${id}`);
}

const sound = document.getElementById('soundToggle');
must(sound?.tagName === 'BUTTON', 'sound tray control must be a button');
must(sound.getAttribute('aria-pressed') === 'false', 'sound must be off by default in markup');
must(document.querySelector('#bootScreen.hidden #bootSkip'), 'optional hidden boot with skip control missing');
must(document.querySelector('.project-archive-shell > .project-archive-content'), 'project archive motion wrapper missing');
must(document.querySelector('#caseStudyWindow #caseStudyFrame:not([src])'), 'deferred nested case-study window missing');
must(document.getElementById('systemStatusText')?.getAttribute('aria-live') === 'polite', 'semantic system status missing');

for (const phrase of [
  "uiSound:false",
  'function animateWindowOutline',
  'maximizeGeometryProperties.forEach',
  'win.dataset.restoreInlineStyle',
  "data-action=\"toggle-motion\"",
  "data-action=\"restart-os\"",
  'function initProjectArchiveMotion',
  'function initCaseStudyLaunches',
  "event.detail > 0",
  "btn.addEventListener('dblclick'",
]) must(script.includes(phrase), `script contract missing: ${phrase}`);
must(!script.includes('Reloading in ${sec}'), 'boot interrupt must not trigger BSOD reload countdown');
must(!/location\.reload\(\)/.test(script), 'optional boot must not reload the page');

must(css.includes('.os-motion-outline'), 'window outline motion style missing');
must(css.includes('body.os-motion-ready:not(.no-anim) .start-menu'), 'Start menu reveal style missing');
must(css.includes('@media (prefers-reduced-motion:reduce)'), 'reduced-motion override missing');
must(css.includes('body.no-anim .os-motion-outline'), 'manual motion-off override missing');

console.log('michaelos-motion-regression ok');
