#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const projectsHtml = fs.readFileSync(path.join(root, 'projects/index.html'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;
const clean = (value) => (value || '').replace(/\s+/g, ' ').trim();
const text = (selector) => clean(document.querySelector(selector)?.textContent);
const must = (condition, message) => { if (!condition) throw new Error(message); };

must(document.title === 'Michael Costea — useful AI, weird projects & old devices', `homepage title lacks personal workshop framing: ${document.title}`);
must((document.querySelector('meta[name="description"]')?.content || '').includes('weird little workshop'), 'personal workshop description missing');
must(document.querySelector('link[href="styles.css?v=20260820-weird-workshop"]'), 'workshop stylesheet cache marker missing');

const welcomeTitle = text('#readerWindow .win-title span');
must(welcomeTitle === "💾 Welcome.exe - Michael's Weird Little Workshop", `welcome title wrong: ${welcomeTitle}`);
const hero = document.querySelector('#readerWindow .career-showcase-hero');
must(hero, 'homepage hero missing');
const heroText = clean(hero.textContent);
for (const phrase of ['I MAKE USEFUL THINGS. SOME GET WEIRD.', 'ELECTRICIAN-TURNED-TECH OPERATOR', 'OLD HARDWARE NEW JOBS', 'AI HELP WITHOUT THE THEATRE']) {
  must(heroText.toUpperCase().includes(phrase), `personal hero missing ${phrase}`);
}
for (const forbidden of ['795', 'A$1.97M', '251 H', 'CURRENT AEH OPERATING IMPACT', 'DISCUSS A ROLE', 'VIEW RÉSUMÉ PDF', 'PIPELINE IS ASSOCIATED', 'AT WORK']) {
  must(!heroText.toUpperCase().includes(forbidden), `homepage hero retains hard-sell/work-first copy: ${forbidden}`);
}
must(!hero.querySelector('.career-proof-grid'), 'homepage metric scorecard must be removed');
const interests = [...hero.querySelectorAll('.career-interest-grid article')];
must(interests.length === 3, `expected three personal interest cards, got ${interests.length}`);
for (const phrase of ['PROJECT SHELF', 'AI HELP', 'DEVICE LAB']) {
  must(interests.some(card => clean(card.textContent).toUpperCase().includes(phrase)), `interest card missing ${phrase}`);
}

const actions = [...hero.querySelectorAll('.career-primary-actions > a, .career-primary-actions > button')].map(node => clean(node.textContent).toUpperCase());
must(JSON.stringify(actions) === JSON.stringify(['OPEN PROJECT SHELF', 'GET AI HELP', 'MEET MICHAEL']), `homepage actions wrong: ${JSON.stringify(actions)}`);
const sidebar = [...document.querySelectorAll('#readerWindow .welcome-sidebar .big-nav')].map(node => clean(node.textContent).toUpperCase());
for (const phrase of ['MEET MICHAEL', 'AI HELP', 'PROJECT SHELF', 'RÉSUMÉ', 'SAY HELLO']) must(sidebar.includes(phrase), `sidebar missing ${phrase}`);
must(!sidebar.includes('DISCUSS A ROLE') && !sidebar.includes('CASE STUDIES'), 'sidebar retains recruiter-first labels');
must(!document.querySelector('#readerWindow .career-secondary-links'), 'duplicated recruiter route bar should be removed from Welcome');

const focus = text('#readerWindow .career-operating-focus');
for (const phrase of ['DAY JOB, BRIEFLY', 'ALL ELECTRIC HOMES', 'PEOPLE SEE WHAT NEEDS ATTENTION']) {
  must(focus.toUpperCase().includes(phrase), `secondary day-job summary missing ${phrase}`);
}
const status = text('#readerWindow .status-bar');
for (const phrase of ['PICK A FOLDER', 'SIDE QUESTS: ACTIVE', 'HYPE: OFF']) must(status.toUpperCase().includes(phrase), `workshop status missing ${phrase}`);
const about = text('#aboutWindow');
for (const phrase of ['ELECTRICIAN', 'OPTUS', 'CAFE', 'ALL ELECTRIC HOMES', 'PROJECTS']) must(about.toUpperCase().includes(phrase), `About Michael missing ${phrase}`);
for (const forbidden of ['84,400', '5,955', 'A$1.97M', '795']) must(!about.includes(forbidden), `About Michael retains metric ${forbidden}`);

const build = text('#buildWindow');
must(build.includes('practical AI tools, connected business systems, and slightly strange side projects'), 'What I Build still lacks relaxed personal framing');
const contact = text('#contactWindow');
must(contact.includes('Say hello') && contact.includes('what you’re making'), 'contact window lacks relaxed hello framing');
must(!contact.toUpperCase().includes('DISCUSS A ROLE') && !contact.toUpperCase().includes('NOT THE RIGHT FIT'), 'contact window retains hard-sell fit language');

const projects = new JSDOM(projectsHtml).window.document;
must(clean(projects.querySelector('#projects-page-title')?.textContent) === 'Things I’ve been making.', 'projects page needs personal heading');
must(clean(projects.querySelector('.supporting-cases-heading h2')?.textContent) === 'Some of the work behind the projects', 'projects support section still reads like a hiring funnel');

console.log('chill-personal-home-regression ok');
