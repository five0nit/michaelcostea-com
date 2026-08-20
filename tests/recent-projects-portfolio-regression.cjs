#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const home = new JSDOM(fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8')).window.document;
const projects = new JSDOM(fs.readFileSync(path.join(rootDir, 'projects/index.html'), 'utf8')).window.document;
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const titles = (document, selector) => [...document.querySelectorAll(selector)].map(card => clean(card.querySelector('h3')?.textContent));

const expected = [
  'Mike Kindle OS',
  'Mundus Vult Decipi',
  'Presence Action Broker',
  'Myo Control / Myo Patchbay',
  'Windows Background Computer Use',
  'LEGO Mario Hardware + Asset Mapping',
  'AgentMesh / Multi-Agent Control Kit',
  'Codex Account Usage + Auth Rotator',
  'RebateSignal',
  'Agentic Framework Session',
  'Brief2Ship',
  'BillPilot / InvoicePipe',
  'Repo-First Starter + Cursor Covenant',
  'Mini Michael',
  'Telegram Office / Agent Office',
  'Automated Social & Brand Content Engine',
  'UseAIForMe.com',
  'AI Profile Sites',
  'michaelcostea.com / MICHAEL OS 89',
];

const homeCards = [...home.querySelectorAll('#projectsWindow .project-showcase-card')];
const projectCards = [...projects.querySelectorAll('.detailed-archive > .project-archive-card')];
if (JSON.stringify(titles(home, '#projectsWindow .project-showcase-card')) !== JSON.stringify(expected)) {
  throw new Error('MichaelOS recent-project order mismatch');
}
if (JSON.stringify(titles(projects, '.detailed-archive > .project-archive-card')) !== JSON.stringify(expected)) {
  throw new Error('crawlable recent-project order mismatch');
}
if (homeCards.length !== 19 || projectCards.length !== 19) throw new Error('portfolio must expose exactly 19 projects');
if (!homeCards.every((card) => !card.hasAttribute('data-rank') && !card.querySelector('.project-rank'))) throw new Error('MichaelOS must not expose ranking ribbons');
if (!projectCards.every((card) => !card.hasAttribute('data-rank') && !card.querySelector('.project-rank'))) throw new Error('crawlable library must not expose ranking ribbons');

const additions = [
  {
    key: 'mini michael',
    title: 'Mini Michael',
    image: 'assets/project-showcase/mini-michael.webp',
    href: 'https://minimemichael.web.app',
    phrases: ['digital twin', 'API', 'provenance', 'feedback'],
  },
  {
    key: 'presence action broker',
    title: 'Presence Action Broker',
    image: 'assets/project-showcase/presence-action-broker.webp',
    phrases: ['permissioned', 'risk', 'replay', 'receipt'],
  },
  {
    key: 'windows background computer use',
    title: 'Windows Background Computer Use',
    image: 'assets/project-showcase/windows-background-computer-use.webp',
    phrases: ['UIAutomation', 'no focus steal', 'WSL', 'verified'],
  },
  {
    key: 'myo control / myo patchbay',
    title: 'Myo Control / Myo Patchbay',
    image: 'assets/project-showcase/myo-control.webp',
    phrases: ['Direct Bluetooth LE', '8-channel EMG', 'training', 'owner-device install'],
  },
  {
    key: 'mundus vult decipi',
    title: 'Mundus Vult Decipi',
    image: 'assets/project-showcase/mundus-vult-decipi.webp',
    href: 'https://mundus-vult-decipi.web.app',
    phrases: ['participatory artwork', 'Firebase', 'anonymous', 'removal'],
  },
  {
    key: 'mike kindle os',
    title: 'Mike Kindle OS',
    image: 'assets/project-showcase/mike-kindle-os.webp',
    phrases: ['Kindle Paperwhite 2', 'KOReader', 'native', 'offline'],
  },
  {
    key: 'lego mario hardware + asset mapping',
    title: 'LEGO Mario Hardware + Asset Mapping',
    image: 'assets/project-showcase/lego-mario-mapping.webp',
    phrases: ['CC26x2R1', '8 MiB', 'asset', 'owner-device'],
  },
];

for (const addition of additions) {
  for (const [document, selector, label] of [
    [home, `#projectsWindow [data-project="${addition.key}"]`, 'MichaelOS'],
    [projects, `.detailed-archive [data-project="${addition.key}"]`, 'crawlable'],
  ]) {
    const card = document.querySelector(selector);
    if (!card) throw new Error(`${label} missing ${addition.title}`);
    const text = clean(card.textContent);
    for (const phrase of addition.phrases) if (!text.toLowerCase().includes(phrase.toLowerCase())) throw new Error(`${addition.title} missing ${phrase}`);
    const image = card.querySelector(`img[src^="${addition.image}"]`);
    if (!image) throw new Error(`${addition.title} missing public proof image`);
    if (addition.href && !card.querySelector(`a[href="${addition.href}"]`)) throw new Error(`${addition.title} missing exact live URL`);
  }
  const asset = path.join(rootDir, addition.image);
  if (!fs.existsSync(asset) || fs.statSync(asset).size < 10000) throw new Error(`${addition.title} proof asset missing or too small`);
}

if (!clean(home.querySelector('#projectsWindow .app-store-browser-head')?.textContent).includes('All 19 here')) {
  throw new Error('MichaelOS visible-project count is stale');
}
if (!clean(projects.querySelector('#ranked-projects-title')?.textContent).includes('Michael’s project shelf')) {
  throw new Error('crawlable visible-project count is stale');
}

console.log('recent-projects-portfolio-regression ok');
