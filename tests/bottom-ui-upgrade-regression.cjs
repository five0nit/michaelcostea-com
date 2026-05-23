#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'ux-preview.html'), 'utf8');
const css = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;

function text(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`missing ${selector}`);
  return el.textContent.replace(/\s+/g, ' ').trim();
}
function assertIncludes(name, value, expected) {
  if (!value.includes(expected)) throw new Error(`${name} should include ${JSON.stringify(expected)}, got ${JSON.stringify(value.slice(0, 260))}`);
}

if (!document.body.classList.contains('ux-preview-page')) {
  throw new Error('ux-preview should have page-specific class for bottom UI upgrades');
}

const status = text('#readerWindow .status-bar');
assertIncludes('status bar', status, 'Ready. System status: Scaling.');
assertIncludes('status bar', status, 'AI: LIVE');
assertIncludes('status bar', status, 'OPS: ONLINE');

const taskbar = text('.taskbar');
assertIncludes('bottom taskbar', taskbar, 'Start');
assertIncludes('bottom taskbar', taskbar, 'UXPreview.exe');
assertIncludes('bottom taskbar', taskbar, 'MICHAEL OS 89');
assertIncludes('bottom taskbar', taskbar, 'SYS');

if (!document.querySelector('.ux-taskbar-brand')) throw new Error('missing MICHAEL OS 89 taskbar brand segment');
if (!document.querySelector('.ux-taskbar-app')) throw new Error('missing active UXPreview taskbar app segment');
if (!document.querySelector('.ux-tray-status')) throw new Error('missing tray SYS status segment');

if (!/\.public-preview\.ux-preview-page \.taskbar\{[^}]*height:56px/.test(css)) {
  throw new Error('ux preview taskbar should be taller and page-scoped');
}
if (!/\.public-preview\.ux-preview-page \.status-bar span::before/.test(css)) {
  throw new Error('status bar should add LED-style before markers');
}
if (!/padding-bottom:calc\(136px \+ env\(safe-area-inset-bottom,0px\)\)/.test(css)) {
  throw new Error('mobile preview should include safe bottom padding for phone nav');
}

console.log('bottom-ui-upgrade-regression ok');
