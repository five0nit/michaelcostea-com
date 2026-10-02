#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const additions = [
  { key: 'info charm', title: 'Info Charm', category: 'devices', status: 'Visual concept', phrases: ['sample UI', 'hardware'], image: 'assets/project-showcase/info-charm.webp' },
  { key: 'omi private / hermes voice bridge', title: 'Omi Private / Hermes Voice Bridge', category: 'devices', status: 'Android pilot', phrases: ['whisper.cpp', 'queue overload', 'acceptance'], image: null },
  { key: 'field kit / modular edc cases', title: 'Field Kit / Modular EDC Cases', category: 'devices', status: 'Digital prototype', phrases: ['print-in-place', 'physical', 'Bambu'], image: 'assets/project-showcase/field-kit.webp' },
];
const summaries = [];
for (const file of ['index.html', 'projects/index.html']) {
  const doc = new JSDOM(fs.readFileSync(path.join(root, file), 'utf8')).window.document;
  const browser = doc.querySelector('[data-project-browser]');
  const cards = [...browser.querySelectorAll('article[data-project-category]')];
  assert.equal(cards.length, 32, `${file}: total`);
  assert.equal(new Set(cards.map(c => c.dataset.project)).size, 32, `${file}: unique projects`);
  assert.deepEqual(cards.slice(0, 3).map(c => c.dataset.project), additions.map(a => a.key), `${file}: creation order`);
  assert.equal(cards[3].dataset.project, 'ballz2thewall', `${file}: previous inventory preserved`);
  summaries.push([]);
  for (const item of additions) {
    const card = cards.find(c => c.dataset.project === item.key);
    assert.equal(card.querySelector('h3').textContent.trim(), item.title);
    assert.equal(card.dataset.projectCategory, item.category);
    assert.ok(card.textContent.includes(item.status), `${item.key}: status`);
    for (const phrase of item.phrases) assert.ok(card.textContent.includes(phrase), `${item.key}: ${phrase}`);
    assert.ok(card.querySelector('.app-store-details:not([open]) > summary'));
    assert.ok(!card.hasAttribute('data-created') && !card.hasAttribute('data-rank'));
    assert.ok(card.querySelector('.app-store-primary-action, .archive-action a'));
    if (item.image) {
      assert.ok(card.querySelector(`img[src^="${item.image}"]`));
      assert.ok(fs.statSync(path.join(root, item.image)).size > 10000);
    } else {
      assert.ok(card.querySelector('.app-store-placeholder'), 'private voice project uses text, not fabricated screenshot');
    }
    // Existing public contact CTA is allowed; private runtime/contact material is not.
    const privacyScan = card.innerHTML.replace('mailto:costea.michael@gmail.com?subject=Omi%20Private%20prototype', 'PUBLIC_CONTACT');
    assert.ok(!/\/home\/|\/mnt\/|192\.168\.|100\.\d+\.\d+\.\d+|Bearer\s+[A-Za-z0-9]|@gmail\.com/.test(privacyScan), 'no private runtime details');
    summaries.at(-1).push(card.querySelector('.app-store-summary').textContent.trim());
  }
  for (const [category, expected] of Object.entries({ all: 32, products: 8, agents: 10, devices: 9, tools: 5 })) {
    assert.equal(browser.querySelector(`[data-project-filter="${category}"] span`).textContent.trim(), String(expected));
  }
  assert.equal(browser.querySelector('.project-browser-count').textContent.trim(), '32 projects');
}
assert.deepEqual(summaries[0], summaries[1], 'summaries must match both public surfaces');
console.log('project-shelf-october-regression ok: three additions, 32 unique projects, synchronized copy and counts');
