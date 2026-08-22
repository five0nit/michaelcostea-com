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
must(!/localhost|127\.0\.0\.1|\/home\/|\/mnt\//i.test(html), 'deployed Gnostobot HTML exposes a local host or path');

const sw = read('gnostobot/sw.js');
for (const asset of ['./social-preview.png', './src/commentary.js', './src/corpus.js', './src/engine.js']) {
  must(sw.includes(asset), `deployed service worker missing ${asset}`);
}

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
