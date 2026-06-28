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
  'github.com/five0nit/brief2ship',
]) {
  must(copy.includes(expected), `New Repo section missing ${expected}`);
}

const githubLink = document.querySelector('#newRepoWindow a[href="https://github.com/five0nit/brief2ship"]');
must(githubLink, 'New Repo window should link to Brief2Ship GitHub repo');

console.log('new-repo-brief2ship-regression ok');
