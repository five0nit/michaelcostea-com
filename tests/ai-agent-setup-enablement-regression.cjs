#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const pages = ['index.html', 'ux-preview.html'];
const expectedImage = 'assets/diagrams/current-ai-setup-structure.jpg?v=20260617-machines-agents';

function assertIncludes(name, value, expected) {
  if (!value.includes(expected)) {
    throw new Error(`${name} should include ${JSON.stringify(expected)}, got ${JSON.stringify(value.slice(0, 420))}`);
  }
}

for (const page of pages) {
  const html = fs.readFileSync(path.join(rootDir, page), 'utf8');
  const dom = new JSDOM(html);
  const { document } = dom.window;

  const agentsImg = document.querySelector('#agentsWindow .agent-setup-diagram img');
  if (!agentsImg) throw new Error(`${page}: missing AI Agents setup diagram image`);
  if (agentsImg.getAttribute('src') !== expectedImage) {
    throw new Error(`${page}: AI Agents setup diagram should use updated cache-busted image, got ${agentsImg.getAttribute('src')}`);
  }
  assertIncludes(`${page}: AI Agents alt`, agentsImg.getAttribute('alt') || '', 'four Work Mac Minis');
  assertIncludes(`${page}: AI Agents caption`, document.querySelector('#agentsWindow .agent-setup-diagram figcaption')?.textContent.replace(/\s+/g, ' ').trim() || '', '25 visible agents');

  const buildWindow = document.querySelector('#buildWindow');
  if (!buildWindow) throw new Error(`${page}: missing What I Build window`);
  const buildText = buildWindow.textContent.replace(/\s+/g, ' ').trim();
  assertIncludes(`${page}: build positioning`, buildText, 'environment that enables the business and the people inside it to become better with AI');
  assertIncludes(`${page}: build expertise`, buildText, 'Staff become AI-capable operators');

  const buildImg = document.querySelector('#buildWindow .business-ai-environment img');
  if (!buildImg) throw new Error(`${page}: missing What I Build business AI environment diagram`);
  if (buildImg.getAttribute('src') !== expectedImage) {
    throw new Error(`${page}: What I Build diagram should reuse updated setup image, got ${buildImg.getAttribute('src')}`);
  }
  assertIncludes(`${page}: build diagram alt`, buildImg.getAttribute('alt') || '', 'environment for business AI enablement');
}

const imagePath = path.join(rootDir, 'assets/diagrams/current-ai-setup-structure.jpg');
if (!fs.existsSync(imagePath)) throw new Error('updated AI setup structure image asset is missing');

console.log('ai-agent-setup-enablement-regression ok');
