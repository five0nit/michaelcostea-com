#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;

function text(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`missing ${selector}`);
  return el.textContent.replace(/\s+/g, ' ').trim();
}
function assertIncludes(name, value, expected) {
  if (!value.includes(expected)) throw new Error(`${name} should include ${JSON.stringify(expected)}, got ${JSON.stringify(value.slice(0, 240))}`);
}

const start = text('#aiHelpWindow');
assertIncludes('AI Help start card grid', start, '3. Prerequisites before install');
assertIncludes('AI Help start card grid', start, 'The guide before the guide');
assertIncludes('AI Help start card grid', start, '4. My Hermes setup');
assertIncludes('AI Help start card grid', start, '8. Five AI tutorials to try');
assertIncludes('AI Help start card grid', start, 'copy/paste lessons');
assertIncludes('AI Help start card grid', start, '10. Build a memory layer');
assertIncludes('AI Help start card grid', start, 'Byterover-style agent memory');
assertIncludes('AI Help new resource card', start, 'New resource: Agentic Framework Session');
assertIncludes('AI Help new resource card', start, 'Discord server comms for multi-person agent work');

const agenticDeck = text('#agenticFrameworkDeckWindow');
assertIncludes('agentic framework deck resource', agenticDeck, 'Agentic Framework Session: Hermes + Discord-ready team comms');
assertIncludes('agentic framework deck resource', agenticDeck, 'Presentation preview');
assertIncludes('agentic framework deck resource', agenticDeck, 'Download PDF');
if (agenticDeck.includes('Download PowerPoint')) throw new Error('agentic framework deck preview should only expose Download PDF as an action');
if (agenticDeck.includes('Fullscreen')) throw new Error('agentic framework deck preview should not expose fullscreen controls');
if (agenticDeck.includes('Open full HTML')) throw new Error('agentic framework deck preview should not expose full HTML controls');
assertIncludes('agentic framework deck resource', agenticDeck, 'Discord section shows how shared server channels let multiple people openly engage the same agents');

const prereqGuide = text('#prerequisitesGuideWindow');
assertIncludes('prerequisites guide title', prereqGuide, 'Prerequisites Before You Install an AI Agent');
assertIncludes('prerequisites guide framing', prereqGuide, 'The guide before the guide');
assertIncludes('prerequisites guide platform table', prereqGuide, 'Dependency prerequisites by platform');
assertIncludes('prerequisites guide platform table', prereqGuide, 'macOS');
assertIncludes('prerequisites guide platform table', prereqGuide, 'Windows native');
assertIncludes('prerequisites guide platform table', prereqGuide, 'Windows WSL Ubuntu');
assertIncludes('prerequisites guide platform table', prereqGuide, 'python3 python3-venv python3-pip');
assertIncludes('prerequisites guide platform table', prereqGuide, 'Node.js 24 LTS');
assertIncludes('prerequisites guide safe folder', prereqGuide, 'Do not skip the safe folder');
assertIncludes('prerequisites guide next step', prereqGuide, 'Guide 4 - My Hermes setup');

const agentGuide = text('#agentGuideWindow');
assertIncludes('agent guide capabilities', agentGuide, 'What can an AI agent do?');
assertIncludes('agent guide capabilities', agentGuide, 'Summarise notes, rewrite rough drafts');
assertIncludes('agent guide capabilities', agentGuide, 'bring back evidence instead of guesses');
assertIncludes('agent guide capabilities', agentGuide, 'flag work that needs human approval');
if (/[📄🔎🧾🧠🛠️📊]/u.test(agentGuide)) throw new Error('agent guide capabilities should not use emoji labels');

const knowledgebaseGuide = text('#agenticKnowledgebaseWindow');
assertIncludes('agentic workflow knowledgebase', knowledgebaseGuide, 'Command bank: copy/paste agent instructions');
assertIncludes('agentic workflow knowledgebase', knowledgebaseGuide, 'Dropdown copy/paste commands');
assertIncludes('agentic workflow knowledgebase', knowledgebaseGuide, 'High-autonomy operator upgrade');
assertIncludes('agentic workflow knowledgebase', knowledgebaseGuide, 'Install the memory layer habit');
assertIncludes('agentic workflow knowledgebase', knowledgebaseGuide, 'WSL-first local setup');
assertIncludes('agentic workflow knowledgebase', knowledgebaseGuide, 'Shared-agent handoff receipt');
assertIncludes('agentic workflow knowledgebase', knowledgebaseGuide, 'Best modifications to add to any agent');
assertIncludes('agentic workflow knowledgebase', knowledgebaseGuide, 'Rules and guidelines that stop agents going sideways');
assertIncludes('agentic workflow knowledgebase', knowledgebaseGuide, 'Do the work end-to-end, then report done, verified, pending, blocked');
assertIncludes('agentic workflow knowledgebase', knowledgebaseGuide, 'Never put secrets in memory, prompts, receipts, screenshots, or logs');
assertIncludes('agentic workflow knowledgebase', knowledgebaseGuide, 'Agent-to-agent memory');
assertIncludes('agentic workflow knowledgebase', knowledgebaseGuide, 'Human memory layer');
const kbDropdowns = document.querySelectorAll('#agenticKnowledgebaseWindow details.kb-command-dropdown');
if (kbDropdowns.length < 6) throw new Error(`expected at least 6 command dropdowns, got ${kbDropdowns.length}`);

const memoryGuide = text('#memoryLayerGuideWindow');
assertIncludes('memory layer tutorial', memoryGuide, 'Build a memory layer for your agent');
assertIncludes('memory layer tutorial', memoryGuide, 'Don’t forget who you are');
assertIncludes('memory layer tutorial', memoryGuide, 'Memory is not a nice-to-have for agents');
assertIncludes('memory layer tutorial', memoryGuide, 'Why install Byterover and Obsidian?');
assertIncludes('memory layer tutorial', memoryGuide, 'Byterover: shared agent memory');
assertIncludes('memory layer tutorial', memoryGuide, 'Obsidian: human-readable memory');
assertIncludes('memory layer tutorial', memoryGuide, 'Why both together work');
assertIncludes('memory layer tutorial', memoryGuide, 'Byterover shared layer');
assertIncludes('memory layer tutorial', memoryGuide, 'Obsidian local vault');
assertIncludes('memory layer tutorial prompt', memoryGuide, 'Copy/paste prompt 1');
assertIncludes('memory layer tutorial prompt', memoryGuide, 'Copy/paste prompt 2');
assertIncludes('memory layer tutorial prompt', memoryGuide, 'Copy/paste prompt 3');
assertIncludes('memory layer tutorial prompt', memoryGuide, 'You are my long-running local AI operator');
assertIncludes('memory layer tutorial prompt', memoryGuide, 'Before meaningful work, load memory in this order');
assertIncludes('memory layer tutorial prompt', memoryGuide, 'Set up a local memory layer for this workspace');
assertIncludes('memory layer tutorial prompt', memoryGuide, 'Create an Obsidian-friendly project vault for me');
assertIncludes('memory layer tutorial prompt', memoryGuide, 'After meaningful work, write a short durable receipt');

const tutorials = text('#aiTutorialsGuideWindow');
assertIncludes('tutorial guide', tutorials, 'Practical AI Tutorials That Actually Help');
assertIncludes('tutorial guide', tutorials, 'quality bar');
assertIncludes('tutorial guide', tutorials, 'Tutorial 1 — turn messy notes into an action plan');
assertIncludes('tutorial guide', tutorials, 'Tutorial 5 — create a weekly exception report');
assertIncludes('tutorial guide', tutorials, 'Turn a good tutorial into an agent workflow');

const install = text('#hermesGuideWindow');
assertIncludes('install guide title', install, 'My Hermes setup');
assertIncludes('install guide depth', install, '23 chapters');
assertIncludes('install guide discovery', install, 'Brief2Ship');
assertIncludes('install guide full page', install, 'Open full guide');
const frame = document.querySelector('#hermesGuideWindow iframe');
if (!frame || frame.getAttribute('src').split('?')[0] !== 'guides/hermes-setup/index.html') throw new Error('Guide must embed the complete replacement HTML');
if (!frame.getAttribute('title')) throw new Error('Guide frame requires accessible title');
if (document.querySelector('#hermesGuideWindow .guide-panel')) throw new Error('Old conflicting installation panels must be removed');
const guideDoc = new JSDOM(fs.readFileSync(path.join(rootDir, 'guides/hermes-setup/index.html'), 'utf8')).window.document;
const fullGuide = guideDoc.body.textContent;
for (const marker of ['wsl --install', 'hermes --version', 'hermes -p operator setup', 'terminal.cwd', 'Brief2Ship', 'brief2ship discover', 'SOUL.md', 'Telegram', 'Troubleshooting', 'cron runs']) {
  assertIncludes('complete HTML install guide', fullGuide, marker);
}
if ([...guideDoc.querySelectorAll('h2')].filter(h => /^\d+\./.test(h.textContent)).length !== 23) throw new Error('Expected all 23 guide chapters');

console.log('ai-help-content-regression ok');
