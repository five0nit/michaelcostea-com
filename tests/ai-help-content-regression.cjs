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
assertIncludes('AI Help start card grid', start, '4. Install Hermes or OpenClaw');
assertIncludes('AI Help start card grid', start, '8. Five AI tutorials to try');
assertIncludes('AI Help start card grid', start, 'copy/paste lessons');
assertIncludes('AI Help start card grid', start, '10. Build a memory layer');
assertIncludes('AI Help start card grid', start, 'Byterover-style agent memory');

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
assertIncludes('prerequisites guide next step', prereqGuide, 'Guide 4 - Install Hermes or OpenClaw');

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
assertIncludes('install guide', install, 'Simple install rule');
assertIncludes('install guide', install, 'Hermes: easiest first choice');
assertIncludes('install guide', install, 'OpenClaw: choose when you want a bigger local control plane');
assertIncludes('install guide', install, 'Do not connect real business systems on day one');
assertIncludes('install guide dynamic prereqs', install, 'This checklist changes with Step 0');
assertIncludes('install guide Hermes Mac prereqs', install, 'Xcode Command Line Tools');
assertIncludes('install guide Hermes Mac prereqs', install, 'Homebrew before the one-line Hermes installer');
assertIncludes('install guide dependency prerequisites', install, 'Dependency prerequisites by platform');
assertIncludes('install guide dependency prerequisites', install, 'macOS');
assertIncludes('install guide dependency prerequisites', install, 'Windows native');
assertIncludes('install guide dependency prerequisites', install, 'Windows WSL Ubuntu');
assertIncludes('install guide dependency prerequisites', install, 'python3 python3-venv python3-pip');
assertIncludes('install guide dependency prerequisites', install, 'Node.js 24 LTS');
assertIncludes('install guide dependency prerequisites', install, 'node --version');
assertIncludes('install guide dependency prerequisites', install, 'python --version');
assertIncludes('install guide OpenClaw prereqs', install, 'Node 24');
assertIncludes('install guide dependency warning', install, 'If any required item above is missing, fix that first');
assertIncludes('install guide title number', install, 'Install Your First AI Agent');
assertIncludes('install guide Hermes detail', install, 'Hermes beginner map');
assertIncludes('install guide Hermes detail', install, 'Install → reload shell → version check → setup/provider → local chat → doctor/status → optional Telegram');
assertIncludes('install guide Hermes detail', install, 'Where Hermes stores things');
assertIncludes('install guide Hermes detail', install, '~/.hermes/config.yaml');
assertIncludes('install guide Hermes detail', install, '~/.hermes/.env');
assertIncludes('install guide Hermes detail', install, '~/.hermes/sessions');
assertIncludes('install guide Hermes provider', install, 'Provider setup choices');
assertIncludes('install guide Hermes provider', install, 'hermes auth add openai-codex');
assertIncludes('install guide Hermes provider', install, 'OPENROUTER_API_KEY');
assertIncludes('install guide Hermes first commands', install, 'mkdir -p ~/ai-agent-test');
assertIncludes('install guide Hermes first commands', install, 'hermes chat -q "Look only in this folder. Summarise test-note.txt. Do not edit files."');
assertIncludes('install guide Hermes troubleshooting', install, 'If Hermes still fails after setup');

const prereqPanels = document.querySelectorAll('#hermesGuideWindow [data-prereq-product][data-prereq-os]');
if (prereqPanels.length !== 6) throw new Error(`expected 6 dynamic prereq panels, got ${prereqPanels.length}`);
for (const product of ['hermes', 'openclaw']) {
  for (const os of ['mac', 'windows', 'linux']) {
    const panel = document.querySelector(`#hermesGuideWindow [data-prereq-product="${product}"][data-prereq-os="${os}"]`);
    if (!panel) throw new Error(`missing prereq panel for ${product}/${os}`);
  }
}

console.log('ai-help-content-regression ok');
