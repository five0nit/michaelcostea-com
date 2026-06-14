#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;

function text(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`missing ${selector}`);
  return el.textContent.replace(/\s+/g, ' ').trim();
}
function assertIncludes(name, value, expected) {
  if (!value.includes(expected)) throw new Error(`${name} should include ${JSON.stringify(expected)}, got ${JSON.stringify(value.slice(0, 240))}`);
}

const start = text('#aiHelpWindow');
assertIncludes('AI Help start card grid', start, '7. Five AI tutorials to try');
assertIncludes('AI Help start card grid', start, 'copy/paste lessons');
assertIncludes('AI Help start card grid', start, '9. Build a memory layer');
assertIncludes('AI Help start card grid', start, 'Byterover-style agent memory');

const memoryGuide = text('#memoryLayerGuideWindow');
assertIncludes('memory layer tutorial', memoryGuide, 'Build a memory layer for your agent');
assertIncludes('memory layer tutorial', memoryGuide, 'Don’t forget who you are');
assertIncludes('memory layer tutorial', memoryGuide, 'Memory is not a nice-to-have for agents');
assertIncludes('memory layer tutorial', memoryGuide, 'Byterover-style agent-to-agent memory layer');
assertIncludes('memory layer tutorial', memoryGuide, 'Obsidian local human layer');
assertIncludes('memory layer tutorial prompt', memoryGuide, 'Copy/paste prompt to give your agent');
assertIncludes('memory layer tutorial prompt', memoryGuide, 'You are my long-running local AI operator');
assertIncludes('memory layer tutorial prompt', memoryGuide, 'Before meaningful work, load memory in this order');
assertIncludes('memory layer tutorial prompt', memoryGuide, 'After meaningful work, write a short durable receipt');

const tutorials = text('#aiTutorialsGuideWindow');
assertIncludes('tutorial guide', tutorials, 'Practical AI Tutorials That Actually Help');
assertIncludes('tutorial guide', tutorials, 'quality bar');
assertIncludes('tutorial guide', tutorials, 'Tutorial 1 — turn messy notes into an action plan');
assertIncludes('tutorial guide', tutorials, 'Tutorial 5 — create a weekly exception report');
assertIncludes('tutorial guide', tutorials, 'Turn a good tutorial into an agent workflow');

const install = text('#hermesGuideWindow');
assertIncludes('install guide', install, 'Simple install rule');
assertIncludes('install guide', install, 'Hermes: easiest first choice');
assertIncludes('install guide', install, 'OpenClaw: choose when you want a bigger local control plane');
assertIncludes('install guide', install, 'Do not connect real business systems on day one');
assertIncludes('install guide dynamic prereqs', install, 'This checklist changes with Step 0');
assertIncludes('install guide Hermes Mac prereqs', install, 'Xcode Command Line Tools');
assertIncludes('install guide Hermes Mac prereqs', install, 'Homebrew before the one-line Hermes installer');
assertIncludes('install guide OpenClaw prereqs', install, 'Node 24');
assertIncludes('install guide dependency warning', install, 'If any required item above is missing, fix that first');

const prereqPanels = document.querySelectorAll('#hermesGuideWindow [data-prereq-product][data-prereq-os]');
if (prereqPanels.length !== 6) throw new Error(`expected 6 dynamic prereq panels, got ${prereqPanels.length}`);
for (const product of ['hermes', 'openclaw']) {
  for (const os of ['mac', 'windows', 'linux']) {
    const panel = document.querySelector(`#hermesGuideWindow [data-prereq-product="${product}"][data-prereq-os="${os}"]`);
    if (!panel) throw new Error(`missing prereq panel for ${product}/${os}`);
  }
}

console.log('ai-help-content-regression ok');
