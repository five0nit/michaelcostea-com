#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const surfaces = ['index.html', 'projects/index.html'].map(file => ({
  file,
  document: new JSDOM(fs.readFileSync(path.join(root, file), 'utf8')).window.document,
}));
const contracts = [
  {
    key: 'ballz2thewall',
    phrases: ['0.3.0a0.dev6', '917 passed, 4 skipped', 'v0.2.0a2', 'acceptance remain pending', 'managed OFF/rollback'],
    links: ['https://five0nit.github.io/Ballz2theWALL/', 'https://github.com/five0nit/Ballz2theWALL', 'https://github.com/five0nit/Ballz2theWALL/blob/main/docs/VERIFICATION.md'],
  },
  {
    key: 'brief2ship',
    phrases: ['dependency-free Python', 'portable Agent Skill', 'local code', 'GitHub', 'PyPI', 'npm', 'crates.io', 'Hugging Face', 'v0.7.0', 'v0.8.0', 'unreleased', 'inconclusive'],
    links: ['https://github.com/five0nit/brief2ship'],
    forbidden: ['Public operating standard for turning rough AI requests'],
  },
  {
    key: 'codex account usage + auth rotator',
    phrases: ['codex-switch-secure', 'Quota-aware', 'CLI/TUI', 'localhost-only', 'xjoker/codex-switch', 'source-build installers'],
    links: ['https://github.com/five0nit/codex-switch-secure', 'https://github.com/xjoker/codex-switch'],
    forbidden: ['Private operator tool', 'Private secure mirror', 'Private repo'],
  },
  {
    key: 'automated social & brand content engine',
    phrases: ['pinned', 'source', 'QA', 'readback'],
    links: [],
  },
];

for (const { file, document } of surfaces) {
  const cards = [...document.querySelectorAll('article[data-project-category]')];
  assert.equal(cards.length, 29, `${file}: project count`);
  assert.equal(cards[0].dataset.project, 'ballz2thewall', `${file}: newest project first`);
  assert.equal(new Set(cards.map(card => card.dataset.project)).size, cards.length, `${file}: duplicate cards`);
  for (const contract of contracts) {
    const card = cards.find(item => item.dataset.project === contract.key);
    assert.ok(card, `${file}: missing ${contract.key}`);
    const text = clean(card.textContent);
    for (const phrase of contract.phrases) assert.ok(text.includes(phrase), `${file}/${contract.key}: missing ${phrase}`);
    for (const phrase of contract.forbidden || []) assert.ok(!text.includes(phrase), `${file}/${contract.key}: stale ${phrase}`);
    for (const url of contract.links) assert.ok(card.querySelector(`a[href="${url}"]`), `${file}/${contract.key}: missing ${url}`);
    assert.ok(card.querySelector('.app-store-details:not([open])'), `${file}/${contract.key}: details must start closed`);
    const image = card.querySelector('img');
    assert.ok(image && fs.existsSync(path.join(root, image.getAttribute('src').split('?')[0])), `${file}/${contract.key}: image missing`);
  }
  assert.ok(!cards.some(card => /BlockBeacon|Brand Studio|Lead Intelligence/.test(card.textContent)), `${file}: excluded addition present`);
  for (const anchor of document.querySelectorAll('article[data-project-category] a[target="_blank"]')) {
    assert.ok(anchor.rel.includes('noopener'), `${file}: external link missing noopener`);
  }
}

for (const { key } of contracts) {
  const summaries = surfaces.map(({ document }) => clean([...document.querySelectorAll('article[data-project-category]')].find(card => card.dataset.project === key).querySelector('.app-store-summary').textContent));
  assert.equal(summaries[0], summaries[1], `${key}: summaries drifted across surfaces`);
}
for (const id of ['newRepoWindow', 'brief2shipExplainerWindow']) {
  const text = clean(surfaces[0].document.getElementById(id).textContent);
  for (const phrase of ['dependency-free Python', 'portable Agent Skill', 'v0.7.0', 'v0.8.0', 'unreleased', 'inconclusive']) {
    assert.ok(text.includes(phrase), `${id}: missing ${phrase}`);
  }
}
console.log('portfolio-refresh-regression ok: 29 projects, four scoped updates, two excluded additions');
