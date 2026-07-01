#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;

function must(condition, message) {
  if (!condition) throw new Error(message);
}

const cards = [...document.querySelectorAll('#projectsWindow .project-showcase-grid > .project-showcase-card')];
must(cards.length >= 10, `expected project showcase cards, got ${cards.length}`);

const titles = cards.map((card) => card.querySelector('h3')?.textContent.trim());
const expectedFirst = [
  'michaelcostea.com / MICHAEL OS 89',
  'RebateSignal',
  'InvoicePipe',
  'Brief2Ship',
  'Automated Social Life & Brand Engine',
];
for (let i = 0; i < expectedFirst.length; i += 1) {
  must(titles[i] === expectedFirst[i], `card ${i + 1} should be ${expectedFirst[i]}, got ${titles[i]}`);
}

for (const [title, image, requiredCopy] of [
  ['michaelcostea.com / MICHAEL OS 89', 'assets/project-showcase/michael-os-89.webp', 'proof hub'],
  ['Brief2Ship', 'assets/project-showcase/brief2ship.webp', 'report lane'],
]) {
  const card = cards.find((candidate) => candidate.querySelector('h3')?.textContent.trim() === title);
  must(card, `missing ${title} card`);
  must(card.querySelector(`img[src^="${image}"]`), `${title} should have its new printscreen image`);
  must(card.querySelector(`a[href="${image}"]`), `${title} should link to the printscreen`);
  must(card.textContent.includes(requiredCopy), `${title} should include updated content marker ${requiredCopy}`);
}

for (const image of ['michael-os-89.webp', 'brief2ship.webp']) {
  const imagePath = path.join(rootDir, 'assets/project-showcase', image);
  must(fs.existsSync(imagePath), `missing generated project printscreen ${image}`);
  must(fs.statSync(imagePath).size > 10_000, `project printscreen ${image} looks too small`);
}

const uniquePriorityTitles = expectedFirst.map((title) => titles.filter((candidate) => candidate === title).length);
for (let i = 0; i < uniquePriorityTitles.length; i += 1) {
  must(uniquePriorityTitles[i] === 1, `${expectedFirst[i]} should appear exactly once in the project showcase`);
}

console.log('project-showcase-priority-regression ok');
