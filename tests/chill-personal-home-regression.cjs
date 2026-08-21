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

must(document.title === 'Michael Costea — AI employees for real businesses', `homepage title lacks agent-operations framing: ${document.title}`);
must((document.querySelector('meta[name="description"]')?.content || '').includes('AI employees with defined roles, tools, memory, approvals and receipts'), 'agentic-system description missing');
must(document.querySelector('link[href="styles.css?v=20260821-mobile-profile-top"]'), 'mobile-profile stylesheet cache marker missing');

const welcomeTitle = text('#readerWindow .win-title span');
must(welcomeTitle === '💾 Welcome.exe - AI Employee Systems', `welcome title wrong: ${welcomeTitle}`);
const hero = document.querySelector('#readerWindow .career-showcase-hero');
must(hero, 'homepage hero missing');
const heroText = clean(hero.textContent);
for (const phrase of ['I BUILD AI EMPLOYEES TO RUN THE BUSINESS WITH YOU.', 'AI SYSTEMS EXPERT', 'DESIGNS AND INTEGRATES MULTI-AGENT WORKFORCES', 'ROLE-BASED AI EMPLOYEES', 'APPROVAL LIMITS', 'PROOF OF WORK']) {
  must(heroText.toUpperCase().includes(phrase), `agent-operations hero missing ${phrase}`);
}
for (const forbidden of ['ELECTRICIAN', 'TURNED-TECH', 'OLD_DEVICES', 'OLD HARDWARE', 'DEVICE LAB', 'WEIRD LITTLE WORKSHOP', 'I MAKE USEFUL THINGS', '795', 'A$1.97M', '251 H', 'CURRENT AEH OPERATING IMPACT', 'DISCUSS A ROLE', 'VIEW RÉSUMÉ PDF']) {
  must(!heroText.toUpperCase().includes(forbidden), `homepage hero retains rejected or work-first copy: ${forbidden}`);
}
must(!hero.querySelector('.career-proof-grid'), 'homepage metric scorecard must be removed');
const interests = [...hero.querySelectorAll('.career-interest-grid article')];
must(interests.length === 3, `expected three agent-system cards, got ${interests.length}`);
for (const phrase of ['AI EMPLOYEES', 'AGENT CONTROL PLANE', 'GOVERNED EXECUTION']) {
  must(interests.some(card => clean(card.textContent).toUpperCase().includes(phrase)), `agent-system card missing ${phrase}`);
}

const actions = [...hero.querySelectorAll('.career-primary-actions > a, .career-primary-actions > button')].map(node => clean(node.textContent).toUpperCase());
must(JSON.stringify(actions) === JSON.stringify(['OPEN AI EMPLOYEE STACK', 'CONFIGURE MY AI TEAM', 'SEE WORKING SYSTEMS']), `homepage actions wrong: ${JSON.stringify(actions)}`);
const sidebar = [...document.querySelectorAll('#readerWindow .welcome-sidebar .big-nav')].map(node => clean(node.textContent).toUpperCase());
for (const phrase of ['AI EMPLOYEES', 'CONFIGURE A TEAM', 'WORKING SYSTEMS', 'MEET MICHAEL', 'RÉSUMÉ']) must(sidebar.includes(phrase), `sidebar missing ${phrase}`);
must(!sidebar.includes('AI HELP') && !sidebar.includes('PROJECT SHELF') && !sidebar.includes('SAY HELLO'), 'sidebar retains weak personal-workshop labels');
must(!document.querySelector('#readerWindow .career-secondary-links'), 'duplicated recruiter route bar should be removed from Welcome');

const focus = text('#readerWindow .career-operating-focus');
for (const phrase of ['BUILT IN REAL OPERATIONS', 'ALL ELECTRIC HOMES', 'SALES', 'OPERATIONS', 'FINANCE', 'HUMAN APPROVALS', 'RECEIPTS']) {
  must(focus.toUpperCase().includes(phrase), `real-world operating proof missing ${phrase}`);
}
const status = text('#readerWindow .status-bar');
for (const phrase of ['ASSIGN A BUSINESS FUNCTION', 'AGENT TEAM: ONLINE', 'HUMAN: IN CONTROL', 'RECEIPTS: ON']) must(status.toUpperCase().includes(phrase), `agent-operations status missing ${phrase}`);
const about = text('#aboutWindow');
for (const phrase of ['AI SYSTEMS EXPERT', 'HEAD OF TECH, AI & SYSTEMS', 'MULTI-AGENT SYSTEMS', 'MODEL REASONING', 'GOVERNANCE', 'ALL ELECTRIC HOMES']) must(about.toUpperCase().includes(phrase), `About Michael missing ${phrase}`);
must(!about.toUpperCase().includes('ELECTRICIAN-TURNED') && !about.toUpperCase().includes('YEARS ON THE TOOLS'), 'About Michael leads with trade-history framing');
for (const forbidden of ['84,400', '5,955', 'A$1.97M', '795']) must(!about.includes(forbidden), `About Michael retains metric ${forbidden}`);

const build = text('#buildWindow');
must(build.includes('configure AI employees around real business functions'), 'Agent Systems window lacks role-based business configuration framing');
const agentsWindow = document.querySelector('#agentsWindow');
const agents = clean(agentsWindow?.textContent);
for (const phrase of ['AI employee is not a chatbot with a job title', 'defined responsibilities', 'source of truth', 'approval boundary', 'escalation path', 'proof of work', '25 visible agents']) {
  must(agents.includes(phrase), `AI Employees window missing ${phrase}`);
}
const contact = text('#contactWindow');
must(contact.includes('Which business function needs another reliable pair of hands?'), 'contact window lacks AI-team configuration prompt');
must(!contact.toUpperCase().includes('WHAT YOU’RE MAKING') && !contact.toUpperCase().includes('DRIVING YOU MAD'), 'contact window retains hobby-workshop framing');

const projects = new JSDOM(projectsHtml).window.document;
must(clean(projects.querySelector('#projects-page-title')?.textContent) === 'Things I’ve been making.', 'projects page needs personal heading');
must(clean(projects.querySelector('.supporting-cases-heading h2')?.textContent) === 'Some of the work behind the projects', 'projects support section still reads like a hiring funnel');

console.log('chill-personal-home-regression ok');
