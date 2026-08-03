#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;
const text = (selector) => (document.querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim();
const must = (condition, message) => { if (!condition) throw new Error(message); };

must(document.title.includes('Head of Tech, AI & Systems'), 'homepage title must lead with current role');
must(document.title.includes('Melbourne'), 'homepage title must include Melbourne');
must((document.querySelector('meta[name="description"]')?.content || '').length <= 160, 'homepage description must stay within 160 characters');
must(document.querySelector('link[href="styles.css?v=20260804-mobile-proof-action-legibility"]'), 'homepage styles cache marker must expose mobile proof/action legibility fix');

const hero = document.querySelector('#readerWindow .career-showcase-hero');
must(hero, 'career showcase hero missing');
const heroText = text('#readerWindow .career-showcase-hero');
for (const phrase of ['MICHAEL COSTEA', 'HEAD OF TECH, AI & SYSTEMS', 'MELBOURNE', '795', 'A$1.97M', '251']) {
  must(heroText.toUpperCase().includes(phrase.toUpperCase()), `career hero missing ${phrase}`);
}
const actions = [...hero.querySelectorAll('.career-primary-actions a, .career-primary-actions button')];
must(actions.length === 3, `career hero must have exactly three primary actions, got ${actions.length}`);
for (const phrase of ['VIEW RÉSUMÉ PDF', 'OPEN 3 CASE STUDIES', 'DISCUSS A ROLE']) {
  must(actions.some(action => action.textContent.replace(/\s+/g, ' ').trim().toUpperCase().includes(phrase)), `career action missing ${phrase}`);
}
must(!heroText.includes('US$5'), 'price-led Gumroad product must not appear in career hero');
must(document.querySelector('#resourcesWindow'), 'secondary Tools & Resources window missing');
must(text('#resourcesWindow').includes('Freelancer Client Admin Starter Kit'), 'Gumroad resource must be preserved in secondary resources window');

const featured = [...document.querySelectorAll('#projectsWindow .featured-hiring-case')];
must(featured.length === 3, `expected three featured hiring cases, got ${featured.length}`);
for (const card of featured) {
  const cardText = card.textContent;
  for (const label of ['Problem:', 'System:', 'Decision:', 'Ownership:', 'Proof:']) {
    must(cardText.includes(label), `${text('h3')} featured case missing ${label}`);
  }
}
must(text('#projectsWindow').includes('Project Archive'), 'project archive label missing');
must(!html.includes('href="https://github.com/five0nit/useaiforme"'), 'private UseAIForMe repo must not be promised publicly');
must(!html.includes('href="https://telegram-office.michaelcostea.com/agenttown/"'), 'unhealthy Agent Office runtime must not be promised publicly');

for (const selector of ['#introDeckSlide', '#agenticDeckSlide']) {
  const image = document.querySelector(selector);
  must(image, `missing ${selector}`);
  must(!image.hasAttribute('src'), `${selector} must not have startup src`);
  must(image.getAttribute('data-src')?.includes('assets/decks/'), `${selector} deferred data-src missing`);
}
must(script.includes('function hydrateDeferredMedia'), 'deferred media hydrator missing');
must(script.includes('function syncActiveWindowAccessibility'), 'active window accessibility sync missing');
must(script.includes('function initSkipLink'), 'route-preserving skip link handler missing');
must(!/initIntroDeckPreview[\s\S]*?\n\s*update\(\);\n\}/.test(script), 'intro deck must not eagerly update during boot');
must(!/initAgenticFrameworkDeckPreview[\s\S]*?\n\s*update\(\);\n\}/.test(script), 'agentic deck must not eagerly update during boot');
must(/\.win-btn,.win-close\{[^}]*min-width:24px[^}]*height:24px/.test(styles), 'desktop window controls must meet 24px target');

const requiredFiles = [
  'resume/index.html',
  'projects/index.html',
  'privacy/index.html',
  'work/knowledge-operations/index.html',
  'work/business-operating-layer/index.html',
  'work/governed-agent-infrastructure/index.html',
  'assets/downloads/Michael-Costea-Resume-2026.pdf',
];
for (const file of requiredFiles) must(fs.existsSync(path.join(root, file)), `missing ${file}`);
for (const route of ['/resume/', '/projects/', '/privacy/', '/work/knowledge-operations/', '/work/business-operating-layer/', '/work/governed-agent-infrastructure/']) {
  must(sitemap.includes(`https://michaelcostea.com${route}`), `sitemap missing ${route}`);
}
for (const routeFile of requiredFiles.filter(file => file.endsWith('index.html'))) {
  const page = fs.readFileSync(path.join(root, routeFile), 'utf8');
  must(!/noindex/i.test(page), `${routeFile} must be indexable`);
  must(/<link rel="canonical" href="https:\/\/michaelcostea\.com\//.test(page), `${routeFile} canonical missing`);
}
const crawlableProjects = new JSDOM(fs.readFileSync(path.join(root, 'projects/index.html'), 'utf8')).window.document;
must(crawlableProjects.querySelector('details.full-archive:not([open])'), 'crawlable project archive should be collapsed behind the three hiring cases');

console.log('showcase-resume-flex-regression ok');
