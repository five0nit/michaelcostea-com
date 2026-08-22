#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const must = (condition, message) => { if (!condition) throw new Error(message); };
const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const routeFiles = [
  'gnostobot/index.html',
  'gnostobot/styles.css',
  'gnostobot/icon.svg',
  'gnostobot/social-preview.png',
  'gnostobot/manifest.webmanifest',
  'gnostobot/sw.js',
  'gnostobot/src/app.js',
  'gnostobot/src/commentary.js',
  'gnostobot/src/corpus.js',
  'gnostobot/src/engine.js',
  'assets/project-showcase/gnostobot.webp'
];
for (const file of routeFiles) must(fs.existsSync(path.join(root, file)), `missing deployed Gnostobot asset: ${file}`);

const html = read('gnostobot/index.html');
const document = new JSDOM(html).window.document;
must(document.querySelector('link[rel="canonical"]')?.href === 'https://michaelcostea.com/gnostobot/', 'Gnostobot canonical URL wrong');
must(document.querySelector('meta[name="robots"]')?.content === 'index, follow', 'Gnostobot must be indexable');
must(document.querySelector('meta[property="og:image"]')?.content === 'https://michaelcostea.com/gnostobot/social-preview.png', 'Gnostobot OG image wrong');
must(document.querySelector('meta[name="twitter:card"]')?.content === 'summary_large_image', 'Gnostobot Twitter card missing');
must(clean(document.querySelector('#layer-legend')?.textContent).includes('Primary witnesses'), 'primary layer legend missing');
must(clean(document.querySelector('#layer-legend')?.textContent).includes('Historical Kindle library'), 'commentary layer legend missing');
const form = html.indexOf('id="question-form"');
const examples = html.indexOf('class="prompt-ribbon"');
const transcript = html.indexOf('id="transcript"');
must(form > -1 && form < examples && examples < transcript, 'ask box must precede examples and answers');
must(clean(document.querySelector('.prompt-label')?.textContent) === 'Try an example', 'example prompts need an explicit label');
must(document.querySelectorAll('[data-prompt]').length === 3, 'example prompt set must stay compact');
must(clean(document.querySelector('.ask-button')?.textContent).includes('GET ANSWER'), 'answer CTA must be explicit');
must(!/localhost|127\.0\.0\.1|\/home\/|\/mnt\//i.test(html), 'deployed Gnostobot HTML exposes a local host or path');

const sw = read('gnostobot/sw.js');
must(sw.includes("gnostobot-v4"), 'direct-answer UX release must invalidate the v3 cache');
for (const asset of ['./social-preview.png', './src/commentary.js', './src/corpus.js', './src/engine.js']) {
  must(sw.includes(asset), `deployed service worker missing ${asset}`);
}

const app = read('gnostobot/src/app.js');
for (const marker of ["createElement('details', 'turn')", 'function scrollTurnToAnswer', "'answer-heading'", "'Source evidence'"]) {
  must(app.includes(marker), `deployed direct-answer app missing ${marker}`);
}
const styles = read('gnostobot/styles.css');
for (const marker of ['.chamber.has-turns .prompt-ribbon', '.answer-heading', '.turn[open] > .turn-question']) {
  must(styles.includes(marker), `deployed direct-answer styles missing ${marker}`);
}

const commentary = read('gnostobot/src/commentary.js');
for (const marker of [
  'Second, completely revised edition, London, 1921',
  'Volume IV is an index',
  'supplied Yogi Publication Society title page dated 1912',
  'containing only Oracles 1–38',
  'Mark Lidzbarski’s German'
]) must(commentary.includes(marker), `deployed commentary missing reviewed provenance: ${marker}`);

const sitemap = read('sitemap.xml');
const routeMatches = sitemap.match(/<loc>https:\/\/michaelcostea\.com\/gnostobot\/<\/loc>/g) || [];
must(routeMatches.length === 1, `sitemap must contain Gnostobot exactly once, found ${routeMatches.length}`);

for (const page of ['index.html', 'projects/index.html']) {
  const pageDocument = new JSDOM(read(page)).window.document;
  const card = pageDocument.querySelector('[data-project-title="Gnostobot"]');
  must(card, `${page} missing Gnostobot project card`);
  const firstCard = pageDocument.querySelector(page === 'index.html'
    ? '.project-showcase-grid > .project-showcase-card'
    : '.detailed-archive > .project-archive-card');
  must(firstCard?.getAttribute('data-project-title') === 'Gnostobot', `${page} must list newest-created Gnostobot first`);
  must(card.querySelector('a[href="gnostobot/"]'), `${page} Gnostobot card route wrong`);
  must(card.querySelector('img[src="assets/project-showcase/gnostobot.webp"]'), `${page} Gnostobot card image wrong`);
}

console.log('gnostobot-route-regression ok');
