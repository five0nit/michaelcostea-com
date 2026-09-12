#!/usr/bin/env node
// Legacy OS/product tabs were replaced by the complete canonical Hermes guide.
// Keep the old regression entry point; verify both existing launchers instead.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { JSDOM } = require('jsdom');
const rootDir = path.resolve(__dirname, '..');
for (const file of ['index.html', 'ux-preview.html']) {
  const dom = new JSDOM(fs.readFileSync(path.join(rootDir, file), 'utf8'), {url:'http://127.0.0.1/',runScripts:'outside-only',pretendToBeVisual:true});
  const {window} = dom;
  window.fetch = async () => ({ok:true,json:async()=>[]});
  window.matchMedia = () => ({matches:false,addEventListener(){},removeEventListener(){}});
  window.eval(fs.readFileSync(path.join(rootDir,'script.js'),'utf8'));
  const root = window.document.getElementById('hermesGuideWindow');
  assert(root, `${file}: existing window identity retained`);
  assert.equal(window.document.querySelectorAll('#hermesGuideWindow').length, 1);
  assert.equal(root.querySelectorAll('.guide-panel,[data-guide-os],[data-guide-product]').length, 0);
  const trigger = window.document.querySelector('#aiHelpWindow [data-open="hermesGuideWindow"]');
  assert(trigger && trigger.textContent.includes('My Hermes setup'));
  const welcomeTrigger = window.document.querySelector('#readerWindow .welcome-copy button[data-open="hermesGuideWindow"]');
  assert(welcomeTrigger, `${file}: guide accessible directly from Welcome content on desktop and mobile`);
  assert.equal(welcomeTrigger.type, 'button');
  assert.equal(welcomeTrigger.textContent.trim().toLowerCase(), 'hermes setup guide');
  assert.equal(welcomeTrigger.getAttribute('aria-controls'), 'hermesGuideWindow');
  // Boot is asynchronous; initialise handlers for this focused test.
  window.initDesktopWindows();
  welcomeTrigger.click();
  assert(root.classList.contains('open'), `${file}: launcher opens replacement`);
  const frame = root.querySelector('iframe');
  assert.equal(frame.getAttribute('src').split('?')[0], 'guides/hermes-setup/index.html');
  assert(frame.title.includes('23 chapters'));
  const full = root.querySelector('a[href="guides/hermes-setup/"]');
  assert(full && full.rel.includes('noopener'));
  assert(root.querySelector('a[download="hermes-starter-pack.zip"]'));
  window.close();
}
console.log('guide-tabs-regression ok: both existing launchers open the full replacement, legacy panels absent');
process.exit(0);
