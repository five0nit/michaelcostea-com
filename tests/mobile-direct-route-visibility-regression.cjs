#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function run() {
  const dom = new JSDOM(html, {
    url: 'http://127.0.0.1/#resume',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.fetch = async () => ({
    ok: true,
    json: async () => ({ owner: 'Michael Costea', bio: { headline: '', summary: '' }, projects: [] }),
  });
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  window.requestAnimationFrame = window.requestAnimationFrame || ((callback) => callback());
  window.eval(script);
  await flush();

  const reader = window.document.getElementById('readerWindow');
  const resume = window.document.getElementById('resumeWindow');
  if (!resume?.classList.contains('open')) throw new Error('mobile #resume route should open the Resume window');
  if (reader?.classList.contains('open')) throw new Error('mobile #resume route must not reopen the homepage above the Resume window');

  window.location.hash = '';
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));
  await flush();
  if (!reader?.classList.contains('open')) throw new Error('returning to mobile home should reopen the homepage');
  if (resume?.classList.contains('open')) throw new Error('returning to mobile home should close the Resume window');

  console.log('mobile-direct-route-visibility-regression ok');
  window.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});