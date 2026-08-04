#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const styledRoutes = [
  'projects/index.html',
  'work/index.html',
  'work/business-operating-layer/index.html',
  'work/knowledge-operations/index.html',
  'work/governed-agent-infrastructure/index.html',
  'privacy/index.html',
];

function must(condition, message) {
  if (!condition) throw new Error(message);
}

for (const route of styledRoutes) {
  const html = fs.readFileSync(path.join(root, route), 'utf8');
  const document = new JSDOM(html).window.document;
  const styles = [...document.querySelectorAll('link[rel="stylesheet"]')].map(link => link.getAttribute('href') || '');
  must(styles.some(href => href.includes('assets/css/michaelos-docs.css?v=20260805-michaelos-docs-preview-1')), `${route} missing MICHAEL OS document stylesheet`);
  must(document.querySelector('#main-content > .os-doc-titlebar'), `${route} missing document title bar`);
  must(document.querySelectorAll('.os-doc-controls i').length === 3, `${route} missing three OS title-bar controls`);
}

for (const route of ['resume/index.html', 'index.html']) {
  const html = fs.readFileSync(path.join(root, route), 'utf8');
  must(!html.includes('michaelos-docs.css'), `${route} must retain its existing presentation without the document-route theme`);
  must(!html.includes('os-doc-titlebar'), `${route} must not inherit document-route chrome`);
}

const css = fs.readFileSync(path.join(root, 'assets/css/michaelos-docs.css'), 'utf8');
for (const marker of [
  '--surface: #c0c0c0',
  '--signal: #000080',
  'font-family: var(--sans)',
  '.os-doc-titlebar',
  '.os-doc-controls',
  '.project-detail',
  '.detailed-archive',
  '.privacy-content',
  '@media (max-width: 760px)',
  '@media print',
]) {
  must(css.includes(marker), `MICHAEL OS document CSS missing ${marker}`);
}

console.log('michaelos-doc-routes-regression ok');
