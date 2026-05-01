#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(rootDir, 'script.js'), 'utf8');
const dom = new JSDOM(html, {
  url: 'http://127.0.0.1/',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});

const { window } = dom;
window.fetch = async () => ({ ok: true, json: async () => [] });
window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
window.eval(script);

const root = window.document.getElementById('hermesGuideWindow');
if (!root) throw new Error('missing #hermesGuideWindow');

function activePanels() {
  return [...root.querySelectorAll('.guide-panel.active')].map((p) => `${p.dataset.panelProduct}|${p.dataset.panelOs}`);
}
function activeChecklists() {
  return [...root.querySelectorAll('[data-checklist-product].active')].map((p) => p.dataset.checklistProduct);
}
function assertState(expectedPanel, expectedChecklist) {
  const panels = activePanels();
  if (panels.length !== 1 || panels[0] !== expectedPanel) {
    throw new Error(`expected one active panel ${expectedPanel}, got ${JSON.stringify(panels)}`);
  }
  const visiblePanels = [...root.querySelectorAll('.guide-panel')].filter((p) => !p.hidden);
  if (visiblePanels.length !== 1 || `${visiblePanels[0].dataset.panelProduct}|${visiblePanels[0].dataset.panelOs}` !== expectedPanel) {
    throw new Error(`expected one unhidden panel ${expectedPanel}, got ${visiblePanels.map((p) => `${p.dataset.panelProduct}|${p.dataset.panelOs}`).join(',')}`);
  }
  const checklists = activeChecklists();
  if (checklists.length !== 1 || checklists[0] !== expectedChecklist) {
    throw new Error(`expected one active checklist ${expectedChecklist}, got ${JSON.stringify(checklists)}`);
  }
  const visibleChecklists = [...root.querySelectorAll('[data-checklist-product]')].filter((p) => !p.hidden);
  if (visibleChecklists.length !== 1 || visibleChecklists[0].dataset.checklistProduct !== expectedChecklist) {
    throw new Error(`expected one unhidden checklist ${expectedChecklist}`);
  }
}

assertState('hermes|mac', 'hermes');
root.querySelector('[data-guide-os="windows"]').click();
assertState('hermes|windows', 'hermes');
root.querySelector('[data-guide-product="openclaw"]').click();
assertState('openclaw|windows', 'openclaw');
root.querySelector('[data-guide-os="linux"]').click();
assertState('openclaw|linux', 'openclaw');

const status = root.querySelector('[data-guide-selection-status]')?.textContent || '';
if (!/OpenClaw on Linux/.test(status)) {
  throw new Error(`status did not update to OpenClaw on Linux: ${status}`);
}

console.log('guide-tabs-regression ok');
window.close();
process.exit(0);
