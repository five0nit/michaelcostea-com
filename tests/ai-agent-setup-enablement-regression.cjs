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
  const agentsImageRef = agentsImg.getAttribute('src') || agentsImg.getAttribute('data-src');
  if (agentsImageRef !== expectedImage) {
    throw new Error(`${page}: AI Agents setup diagram should use updated cache-busted image, got ${agentsImageRef}`);
  }
  if (page === 'index.html' && (agentsImg.getAttribute('src') || !agentsImg.getAttribute('data-src'))) throw new Error('index.html: closed AI Agents window image must stay deferred');
  assertIncludes(`${page}: AI Agents alt`, agentsImg.getAttribute('alt') || '', 'four Work Mac Minis');
  assertIncludes(`${page}: AI Agents caption`, document.querySelector('#agentsWindow .agent-setup-diagram figcaption')?.textContent.replace(/\s+/g, ' ').trim() || '', '25 visible agents');

  const buildWindow = document.querySelector('#buildWindow');
  if (!buildWindow) throw new Error(`${page}: missing What I Build window`);
  const buildText = buildWindow.textContent.replace(/\s+/g, ' ').trim();
  if (page === 'index.html') {
    assertIncludes(`${page}: build positioning`, buildText, 'configure AI employees around real business functions');
    assertIncludes(`${page}: build expertise`, buildText, 'Staff become AI-capable operators');
  } else {
    assertIncludes(`${page}: build positioning`, buildText, 'environment that enables the business and the people inside it to become better with AI');
    assertIncludes(`${page}: build expertise`, buildText, 'Staff become AI-capable operators');
  }

  const buildImg = document.querySelector('#buildWindow .business-ai-environment img');
  if (!buildImg) throw new Error(`${page}: missing What I Build business AI environment diagram`);
  const buildImageRef = buildImg.getAttribute('src') || buildImg.getAttribute('data-src');
  if (buildImageRef !== expectedImage) {
    throw new Error(`${page}: What I Build diagram should reuse updated setup image, got ${buildImageRef}`);
  }
  if (page === 'index.html' && (buildImg.getAttribute('src') || !buildImg.getAttribute('data-src'))) throw new Error('index.html: closed What I Build image must stay deferred');
  assertIncludes(`${page}: build diagram alt`, buildImg.getAttribute('alt') || '', 'environment for business AI enablement');
}

const imagePath = path.join(rootDir, 'assets/diagrams/current-ai-setup-structure.jpg');
if (!fs.existsSync(imagePath)) throw new Error('updated AI setup structure image asset is missing');

console.log('ai-agent-setup-enablement-regression ok');
