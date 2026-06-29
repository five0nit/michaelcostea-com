#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(rootDir, 'script.js'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;

function must(condition, message) {
  if (!condition) throw new Error(message);
}

function text(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`missing ${selector}`);
  return el.textContent.replace(/\s+/g, ' ').trim();
}

must(html.includes('data-open="newRepoWindow"'), 'missing desktop/nav opener for New Repo window');
must(html.includes('href="#new-repo"'), 'missing direct #new-repo page link');
must(script.includes("newRepoWindow: 'new-repo'"), 'missing New Repo route mapping in script.js');
must(script.includes("brief2shipExplainerWindow: 'brief2ship-explainer'"), 'missing Brief2Ship explainer route mapping in script.js');

const newRepo = document.querySelector('#newRepoWindow');
must(newRepo, 'missing #newRepoWindow section');
must(newRepo.getAttribute('aria-label') === 'New Repo', 'New Repo window should have clear aria-label');

const copy = text('#newRepoWindow');
for (const expected of [
  'Brief2Ship',
  'One brief. Better build. Proof included.',
  'lightweight operating standard',
  'repo-first',
  'maintainability gate',
  'anti-slop',
  'proof receipts',
  'report formatting',
  'github.com/five0nit/brief2ship',
]) {
  must(copy.includes(expected), `New Repo section missing ${expected}`);
}

const githubLink = document.querySelector('#newRepoWindow a[href="https://github.com/five0nit/brief2ship"]');
must(githubLink, 'New Repo window should link to Brief2Ship GitHub repo');

const contextButton = document.querySelector('#newRepoWindow [data-open="brief2shipExplainerWindow"]');
must(contextButton, 'See Project Context should open the detailed Brief2Ship explainer window');
must(contextButton.textContent.includes('See project context'), 'context button label should stay clear');

const explainer = document.querySelector('#brief2shipExplainerWindow');
must(explainer, 'missing detailed Brief2Ship explainer window');
must(explainer.getAttribute('aria-label') === 'Brief2Ship explainer', 'explainer window should have clear aria-label');
const explainerCopy = text('#brief2shipExplainerWindow');
for (const expected of [
  'What the repo does',
  'Why it helps',
  'What is inside the repo',
  'Use it when',
  'one-shot prompt',
  'repo-first base selection',
  'maintainability gate',
  'anti-slop UI finish',
  'proof receipts',
  'better first-pass AI builds',
  'Report / Document lane',
  'executive summary',
  'QA report',
  'sources are listed',
  'evidence is separated from assumptions',
  'formatting is skimmable',
  'source-first',
]) {
  must(explainerCopy.includes(expected), `Brief2Ship explainer missing ${expected}`);
}

console.log('new-repo-brief2ship-regression ok');
