#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const must = (condition, message) => { if (!condition) throw new Error(message); };

const expectedCategories = {
  products: 6,
  agents: 7,
  devices: 3,
  tools: 3,
};

function auditBrowser(document, rootSelector, cardSelector, label) {
  const browser = document.querySelector(rootSelector);
  must(browser?.hasAttribute('data-project-browser'), `${label} project browser missing`);
  must(browser.querySelector('.app-store-toolbar'), `${label} App Store toolbar missing`);
  must(browser.querySelector('input.project-browser-search[type="search"]'), `${label} search missing`);
  must(browser.querySelector('.project-browser-count[aria-live="polite"]'), `${label} live result count missing`);

  const buttons = [...browser.querySelectorAll('[data-project-filter]')];
  must(buttons.length === 5, `${label} must expose five category filters`);
  must(buttons[0].dataset.projectFilter === 'all' && buttons[0].getAttribute('aria-pressed') === 'true', `${label} All filter must start active`);
  must(buttons.map(button => button.dataset.projectFilter).join('|') === 'all|products|agents|devices|tools', `${label} category order wrong`);

  const cards = [...browser.querySelectorAll(cardSelector)];
  must(cards.length === 19, `${label} must expose 19 compact apps`);
  must(cards.every(card => !card.hidden), `${label} apps must be visible before filtering`);
  must(cards.every(card => card.dataset.project && card.dataset.projectCategory), `${label} cards need project/category data`);
  must(cards.every(card => card.querySelector('figure')), `${label} every app needs visual artwork or placeholder`);
  must(cards.every(card => card.querySelector('h3')), `${label} every app needs a title`);
  must(cards.every(card => card.querySelector('.app-store-category')), `${label} every app needs visible category`);
  must(cards.every(card => card.querySelector('.app-store-summary')), `${label} every app needs a compact summary`);
  must(cards.every(card => card.querySelector('.app-store-details:not([open]) > summary')), `${label} technical detail must be available but closed initially`);
  must(cards.every(card => card.querySelector('.app-store-primary-action, .archive-action a')), `${label} every app needs a visible launch/proof action`);
  must(cards.every(card => !card.hasAttribute('data-rank') && !card.querySelector('.project-rank')), `${label} must not show ranking ribbons or rank attributes`);

  for (const [category, expected] of Object.entries(expectedCategories)) {
    const actual = cards.filter(card => card.dataset.projectCategory === category).length;
    must(actual === expected, `${label} ${category} expected ${expected}, got ${actual}`);
  }

  must(clean(browser.querySelector('.project-browser-count')?.textContent).includes('19 projects'), `${label} initial count must say 19 projects`);

  for (const title of ['Mini Michael', 'Presence Action Broker', 'Windows Background Computer Use']) {
    must(cards.some(card => clean(card.querySelector('h3')?.textContent) === title), `${label} missing ${title}`);
  }
  must(clean(browser.querySelector('[data-project="agentmesh / multi-agent control kit"]')?.textContent).includes('Control Radar'), `${label} AgentMesh must include Control Radar proof`);
}

const home = new JSDOM(read('index.html')).window.document;
must(!home.querySelector('#projectsWindow details.project-archive-shell'), 'MichaelOS must remove the redundant nested disclosure shell');
auditBrowser(home, '#projectsWindow [data-project-browser]', '.project-showcase-grid > .project-showcase-card', 'MichaelOS');
must(home.querySelector('[data-project="repo-first starter + cursor covenant"] .app-store-placeholder'), 'Repo-First app needs placeholder artwork');
must(home.querySelector('[data-project="codex account usage + auth rotator"] figure img'), 'Codex app must keep its real screenshot');
must(home.querySelector('script[src="project-browser.js?v=20260811-app-store-projects"]'), 'MichaelOS app browser script missing');

const projects = new JSDOM(read('projects/index.html')).window.document;
must(!projects.title.includes('Ranked'), 'project page title must use neutral App Library language');
auditBrowser(projects, 'section[data-project-browser]', '.detailed-archive > .project-archive-card', 'crawlable projects');
must(projects.querySelector('[data-project="repo-first starter + cursor covenant"] .app-store-placeholder'), 'crawlable Repo-First app needs placeholder artwork');
must(projects.querySelector('script[src="project-browser.js?v=20260811-app-store-projects"]'), 'crawlable app browser script missing');

const js = read('project-browser.js');
for (const marker of ['data-project-browser', 'project-browser-search', 'data-project-filter', 'aria-pressed', 'project-browser-count']) {
  must(js.includes(marker), `project browser JS missing ${marker}`);
}

const homeCss = read('styles.css');
for (const marker of [
  '.public-preview .app-store-toolbar{',
  '.public-preview .project-showcase-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))',
  '.public-preview .app-store-details{',
  '.public-preview .app-store-placeholder{',
]) must(homeCss.includes(marker), `MichaelOS App Store CSS missing ${marker}`);
must(!homeCss.includes('.public-preview .project-rank{'), 'MichaelOS rank ribbon CSS must be removed');

const pageCss = read('career.css');
for (const marker of [
  'body[data-page="projects"] .app-store-toolbar',
  'grid-template-columns:repeat(3,minmax(0,1fr))',
  'body[data-page="projects"] .app-store-details',
  '@media (max-width: 720px)',
]) must(pageCss.includes(marker), `crawlable App Store CSS missing ${marker}`);
must(!pageCss.includes('.project-rank{') && !pageCss.includes('.project-rank {'), 'crawlable rank ribbon CSS must be removed');

console.log('project-app-store-regression ok');
