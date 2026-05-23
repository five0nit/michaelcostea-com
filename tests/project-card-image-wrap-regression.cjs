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
  [/\.public-preview #projectsWindow \.ai-project-showcase:not\(\.recent-builds-showcase\) \.mini-content-card\{[^}]*display:grid/, 'project cards should use grid layout'],
  [/\.public-preview #projectsWindow \.ai-project-showcase:not\(\.recent-builds-showcase\) \.mini-card-figure\{[^}]*float:none!important/, 'project card figures should not float/wrap text'],
  [/\.public-preview #projectsWindow \.ai-project-showcase:not\(\.recent-builds-showcase\) \.mini-content-card > p\{[^}]*grid-area:body/, 'project body should have its own grid area beside image'],
  [/\.public-preview #projectsWindow \.ai-project-showcase:not\(\.recent-builds-showcase\) \.mini-content-card > ul\{[^}]*grid-area:list/, 'project bullets should clear below the image/body row'],
  [/@media \(max-width:760px\)[\s\S]*#projectsWindow \.ai-project-showcase:not\(\.recent-builds-showcase\) \.mini-content-card\{[^}]*grid-template-columns:1fr!important/, 'mobile project cards should collapse to one column'],
];
for (const [regex, message] of expectations) {
  if (!regex.test(css)) throw new Error(message);
}

console.log('project-card-image-wrap-regression ok');
