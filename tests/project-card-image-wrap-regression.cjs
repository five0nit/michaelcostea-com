#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'ux-preview.html'), 'utf8');
const css = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;

const cards = [...document.querySelectorAll('#projectsWindow .ai-project-showcase:not(.recent-builds-showcase) .mini-content-card')];
if (cards.length < 6) throw new Error(`expected at least 6 project cards, got ${cards.length}`);

for (const card of cards) {
  if (!card.querySelector(':scope > h3')) throw new Error('project card missing title');
  if (!card.querySelector(':scope > .mini-card-figure > img')) throw new Error('project card missing direct figure image');
  if (!card.querySelector(':scope > p')) throw new Error('project card missing body paragraph');
  if (!card.querySelector(':scope > ul')) throw new Error('project card missing bullet list');
}

const expectations = [
  [/\.public-preview #projectsWindow \.ai-project-showcase:not\(\.recent-builds-showcase\) \.mini-content-card\{[^}]*display:grid/, 'desktop project cards should use a controlled grid layout'],
  [/\.public-preview #projectsWindow \.ai-project-showcase:not\(\.recent-builds-showcase\) \.mini-card-figure\{[^}]*float:none!important/, 'desktop project card figures should not use legacy floats'],
  [/\.public-preview #projectsWindow \.ai-project-showcase:not\(\.recent-builds-showcase\) \.mini-content-card > p\{[^}]*grid-area:body/, 'desktop project body should have its own grid area beside image'],
  [/\/\* === Projects window: mobile text wraps beside mini images cleanly === \*\/[\s\S]*#projectsWindow \.ai-project-showcase:not\(\.recent-builds-showcase\) \.mini-content-card\{[^}]*display:block!important/, 'mobile project cards should switch back to block layout for real text wrap'],
  [/\/\* === Projects window: mobile text wraps beside mini images cleanly === \*\/[\s\S]*#projectsWindow \.ai-project-showcase:not\(\.recent-builds-showcase\) \.mini-card-figure\{[^}]*float:right!important/, 'mobile project figures should float so text wraps beside them'],
  [/\/\* === Projects window: mobile text wraps beside mini images cleanly === \*\/[\s\S]*#projectsWindow \.ai-project-showcase:not\(\.recent-builds-showcase\) \.mini-content-card > p\{[^}]*clear:none!important/, 'mobile project body text should not clear the floated image'],
  [/\/\* === Projects window: mobile text wraps beside mini images cleanly === \*\/[\s\S]*#projectsWindow \.ai-project-showcase:not\(\.recent-builds-showcase\) \.mini-content-card > ul\{[^}]*clear:both!important/, 'mobile bullets should clear after wrapped intro text'],
];
for (const [regex, message] of expectations) {
  if (!regex.test(css)) throw new Error(message);
}

console.log('project-card-image-wrap-regression ok');
