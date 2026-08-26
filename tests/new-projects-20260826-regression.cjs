const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const must = (condition, message) => { if (!condition) throw new Error(message); };

const additions = [
  {
    title: 'CCTAE / Choice–Chance–Time Agency Engine',
    category: 'agents',
    image: 'assets/project-showcase/cctae-agency-engine.webp',
    phrases: ['persistent goals', 'authority', 'verification'],
  },
  {
    title: 'MICHAEL OS Command Centre',
    category: 'devices',
    image: 'assets/project-showcase/michael-os-command-centre.webp',
    phrases: ['Android HOME', 'agent', 'Tailscale'],
  },
  {
    title: 'Hermes Voice / Lynk',
    category: 'devices',
    image: 'assets/project-showcase/hermes-voice-lynk.webp',
    phrases: ['Android', 'voice', 'Hermes'],
  },
  {
    title: 'Context Ledger + Rosco Ray Scanner',
    category: 'agents',
    image: 'assets/project-showcase/context-ledger-rosco.webp',
    phrases: ['memory', 'provenance', 'contradiction'],
  },
  {
    title: 'ClipForge',
    category: 'tools',
    image: 'assets/project-showcase/clipforge.webp',
    phrases: ['FFmpeg', 'six', 'publishing'],
  },
  {
    title: 'Hermes Organisation USB Deployment',
    category: 'tools',
    image: 'assets/project-showcase/hermes-organisation-usb.webp',
    phrases: ['Windows', 'macOS', 'Tailscale'],
  },
  {
    title: 'Bruce Command Center / M5Stick Headless',
    category: 'devices',
    image: 'assets/project-showcase/bruce-command-center.webp',
    phrases: ['M5Stick', 'USB', 'evidence'],
  },
  {
    title: 'Microcap Autotrader / Paper Arena',
    category: 'products',
    image: 'assets/project-showcase/microcap-paper-arena.webp',
    phrases: ['paper-only', 'quote', 'kill switch'],
  },
];

const surfaces = [
  {
    label: 'MichaelOS',
    document: new JSDOM(read('index.html')).window.document,
    rootSelector: '#projectsWindow [data-project-browser]',
    cardSelector: '.project-showcase-card',
  },
  {
    label: 'projects page',
    document: new JSDOM(read('projects/index.html')).window.document,
    rootSelector: 'section[data-project-browser]',
    cardSelector: '.project-archive-card',
  },
];

for (const surface of surfaces) {
  const browser = surface.document.querySelector(surface.rootSelector);
  must(browser, `${surface.label} project browser missing`);
  const cards = [...browser.querySelectorAll(surface.cardSelector)];
  must(cards.length === 28, `${surface.label} expected 28 project cards, got ${cards.length}`);
  const titles = cards.map((card) => clean(card.querySelector('h3')?.textContent));
  must(JSON.stringify(titles.slice(0, 8)) === JSON.stringify(additions.map((item) => item.title)), `${surface.label} new-card priority order wrong: ${JSON.stringify(titles.slice(0, 8))}`);

  const categoryCounts = { products: 8, agents: 9, devices: 6, tools: 5 };
  for (const [category, expected] of Object.entries(categoryCounts)) {
    const actual = cards.filter((card) => card.dataset.projectCategory === category).length;
    must(actual === expected, `${surface.label} ${category} count expected ${expected}, got ${actual}`);
    must(clean(browser.querySelector(`[data-project-filter="${category}"] span`)?.textContent) === String(expected), `${surface.label} ${category} filter label stale`);
  }
  must(clean(browser.querySelector('[data-project-filter="all"] span')?.textContent) === '28', `${surface.label} all filter label stale`);
  must(clean(browser.querySelector('.project-browser-count')?.textContent) === '28 projects', `${surface.label} visible count stale`);

  for (const addition of additions) {
    const card = cards.find((candidate) => clean(candidate.querySelector('h3')?.textContent) === addition.title);
    must(card, `${surface.label} missing ${addition.title}`);
    must(card.dataset.projectCategory === addition.category, `${surface.label} ${addition.title} category wrong`);
    const text = clean(card.textContent);
    for (const phrase of addition.phrases) must(text.toLowerCase().includes(phrase.toLowerCase()), `${surface.label} ${addition.title} missing phrase: ${phrase}`);
    must(card.querySelector(`img[src^="${addition.image}"]`), `${surface.label} ${addition.title} image wrong`);
    must(card.querySelector('.app-store-details'), `${surface.label} ${addition.title} technical details missing`);
    must(/Delivery scope:/i.test(text), `${surface.label} ${addition.title} delivery scope missing`);
    must(/Tech stack:/i.test(text), `${surface.label} ${addition.title} tech stack missing`);
  }
}

for (const addition of additions) {
  const asset = path.join(root, addition.image);
  must(fs.existsSync(asset), `${addition.title} proof asset missing`);
  must(fs.statSync(asset).size >= 10000, `${addition.title} proof asset too small`);
}

const home = surfaces[0].document;
must(clean(home.querySelector('#projectsWindow .app-store-browser-head')?.textContent).includes('All 28 here'), 'MichaelOS project-browser header count stale');
must(home.querySelector('#buildWindow a[href="projects/"]')?.getAttribute('aria-label') === 'View all 28 projects', 'What I Build project count/label stale');
must(clean(home.querySelector('#buildWindow a[href="projects/"]')?.textContent).includes('Project shelf · 28 things'), 'What I Build project-shelf copy stale');

console.log('new-projects-20260826-regression ok');
