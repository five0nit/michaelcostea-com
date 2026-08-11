#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const must = (condition, message) => { if (!condition) throw new Error(message); };
const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const expectedOrder = [
  'RebateSignal',
  'Brief2Ship',
  'michaelcostea.com / MICHAEL OS 89',
  'Telegram Office / Agent Office',
  'Myo Control / Myo Patchbay',
  'Mundus Vult Decipi',
  'Mike Kindle OS',
  'LEGO Mario Hardware + Asset Mapping',
  'BillPilot / InvoicePipe',
  'Automated Social & Brand Content Engine',
  'AgentMesh / Multi-Agent Control Kit',
  'UseAIForMe.com',
  'Agentic Framework Session',
  'AI Profile Sites',
  'Repo-First Starter + Cursor Covenant',
  'Codex Account Usage + Auth Rotator',
];

const projectsHtml = read('projects/index.html');
const projects = new JSDOM(projectsHtml).window.document;
const rankedSection = projects.querySelector('section.full-archive.ranked-projects');
must(rankedSection, 'crawlable projects page must expose a permanent ranked-projects section');
must(!projects.querySelector('details.full-archive'), 'crawlable project inventory must not remain behind details disclosure');
must(projects.querySelector('.page-hero')?.compareDocumentPosition(rankedSection) & 4, 'ranked projects must follow the hero');
must(rankedSection.compareDocumentPosition(projects.querySelector('.project-details')) & 4, 'ranked projects must appear before supporting career cases');
must(clean(projects.querySelector('#projects-page-title')?.textContent).includes('16 working systems'), 'project App Store count must be explicit');
must(clean(rankedSection.querySelector('#ranked-projects-title')?.textContent).includes('ranked strongest first'), 'ranking order must remain explicit without a duplicate visible intro');

const pageCards = [...rankedSection.querySelectorAll('.detailed-archive > .project-archive-card')];
const pageTitles = pageCards.map((card) => clean(card.querySelector('h3')?.textContent));
must(JSON.stringify(pageTitles) === JSON.stringify(expectedOrder), `crawlable rank order wrong: ${JSON.stringify(pageTitles)}`);
pageCards.forEach((card, index) => {
  must(card.dataset.rank === String(index + 1), `${pageTitles[index]} missing data-rank=${index + 1}`);
  must(clean(card.querySelector('.project-rank')?.textContent).startsWith(`Rank ${String(index + 1).padStart(2, '0')}`), `${pageTitles[index]} missing visible rank`);
});

const homeHtml = read('index.html');
const home = new JSDOM(homeHtml).window.document;
const homeArchive = home.querySelector('#projectsWindow section.project-archive-shell[data-project-browser]');
must(homeArchive, 'MichaelOS project App Store must remain permanently visible');
must(!home.querySelector('#projectsWindow details.project-archive-shell'), 'MichaelOS must not hide the App Store behind a redundant disclosure');
const homeCards = [...homeArchive.querySelectorAll('.project-showcase-grid > .project-showcase-card')];
const homeTitles = homeCards.map((card) => clean(card.querySelector('h3')?.textContent));
must(JSON.stringify(homeTitles) === JSON.stringify(expectedOrder), `MichaelOS rank order wrong: ${JSON.stringify(homeTitles)}`);
homeCards.forEach((card, index) => {
  must(card.dataset.rank === String(index + 1), `${homeTitles[index]} missing data-rank=${index + 1}`);
  must(clean(card.querySelector('.project-rank')?.textContent).startsWith(`Rank ${String(index + 1).padStart(2, '0')}`), `${homeTitles[index]} missing visible rank`);
});
must(clean(home.querySelector('#readerWindow .career-primary-actions')?.textContent).includes('VIEW RANKED PROJECTS'), 'homepage hero must lead visitors to ranked projects');
must(home.querySelector('#projectsWindow a[href="billpilot.html"]'), 'BillPilot living project page must be linked from MichaelOS');

const billpilot = new JSDOM(read('billpilot.html')).window.document;
must(billpilot.querySelector('meta[name="robots"]')?.content === 'index, follow', 'BillPilot must be indexable');
const sitemap = read('sitemap.xml');
must(sitemap.includes('<loc>https://michaelcostea.com/billpilot.html</loc>'), 'BillPilot missing from sitemap');

console.log('ranked-project-visibility-regression ok');
