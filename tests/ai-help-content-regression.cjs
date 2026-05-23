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

const tutorials = text('#aiTutorialsGuideWindow');
assertIncludes('tutorial guide', tutorials, 'Five AI Tutorials To Try');
assertIncludes('tutorial guide', tutorials, 'Tutorial 1 — clean up messy notes');
assertIncludes('tutorial guide', tutorials, 'Tutorial 5 — make a small weekly report');
assertIncludes('tutorial guide', tutorials, 'Keep it draft-only');

const install = text('#hermesGuideWindow');
assertIncludes('install guide', install, 'Simple install rule');
assertIncludes('install guide', install, 'Hermes: easiest first choice');
assertIncludes('install guide', install, 'OpenClaw: choose when you want a bigger local control plane');
assertIncludes('install guide', install, 'Do not connect real business systems on day one');

console.log('ai-help-content-regression ok');
