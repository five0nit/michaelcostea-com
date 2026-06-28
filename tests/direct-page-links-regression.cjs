#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(rootDir, 'script.js'), 'utf8');

const expectedLinks = ['#resume', '#what-i-build', '#projects', '#ai-agents', '#new-repo', '#ai-help', '#contact'];
for (const href of expectedLinks) {
  if (!html.includes(`href="${href}"`)) {
    throw new Error(`missing direct page link ${href} in index.html`);
  }
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function run() {
  const dom = new JSDOM(html, {
    url: 'http://127.0.0.1/#projects',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });

  const { window } = dom;
  window.fetch = async () => ({
    ok: true,
    json: async () => ({ owner: 'Michael Costea', bio: { headline: '', summary: '' }, projects: [] }),
  });
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  window.requestAnimationFrame = window.requestAnimationFrame || ((cb) => cb());
  window.eval(script);
  await flush();

  const projectsWindow = window.document.getElementById('projectsWindow');
  if (!projectsWindow?.classList.contains('open')) {
    throw new Error('loading /#projects should open the Projects window');
  }
  if (window.location.hash !== '#projects') {
    throw new Error(`expected hash to stay on #projects, got ${window.location.hash}`);
  }

  window.openWindow('newRepoWindow');
  await flush();
  if (window.location.hash !== '#new-repo') {
    throw new Error(`opening New Repo should sync hash to #new-repo, got ${window.location.hash}`);
  }

  window.openWindow('aiHelpWindow');
  await flush();
  if (window.location.hash !== '#ai-help') {
    throw new Error(`opening AI Help should sync hash to #ai-help, got ${window.location.hash}`);
  }

  window.location.hash = '#resume';
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));
  await flush();
  const resumeWindow = window.document.getElementById('resumeWindow');
  if (!resumeWindow?.classList.contains('open')) {
    throw new Error('hashchange to #resume should open the Resume window');
  }

  window.closeWindow('projectsWindow');
  await flush();
  if (window.location.hash !== '#resume') {
    throw new Error(`closing a background page window should keep the active route on #resume, got ${window.location.hash}`);
  }

  window.closeWindow('resumeWindow');
  await flush();
  if (window.location.hash !== '#ai-help') {
    throw new Error(`closing the active page window should return to the next visible page route, got ${window.location.hash}`);
  }

  console.log('direct-page-links-regression ok');
  window.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
