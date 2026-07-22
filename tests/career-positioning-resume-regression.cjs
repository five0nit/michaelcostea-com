#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const careerCss = fs.readFileSync(path.join(rootDir, 'assets/css/career-resume.css'), 'utf8');
const document = new JSDOM(html).window.document;
const resume = document.querySelector('#resumeWindow');
if (!resume) throw new Error('missing #resumeWindow');
const resumeText = resume.textContent.replace(/\s+/g, ' ').trim();

const requiredPhrases = [
  'AI Enablement Lead',
  'Business Systems & Automation Lead',
  'Marketing Technology / Growth Systems Lead',
  'Business Systems, Lead Flow & Digital Infrastructure — Expanded Scope',
  'Mid-2023 - Present',
  'Selected Operating Work',
  'Business discovery & requirements',
  'AI workflow delivery',
  'Knowledge & adoption',
  '352',
  '5,000+',
  '500,000',
];
for (const phrase of requiredPhrases) {
  if (!resumeText.includes(phrase)) throw new Error(`resume missing recommended positioning: ${phrase}`);
}
if (resumeText.toLowerCase().includes('cto-track')) {
  throw new Error('resume must not use self-awarded CTO-track positioning');
}

const cases = resume.querySelectorAll('.career-fit-case');
if (cases.length !== 3) throw new Error(`expected 3 selected operating-work cases, got ${cases.length}`);

const printable = resume.querySelector('a[href="assets/downloads/michael-costea-resume-2026.html"][target="_blank"]');
if (!printable) throw new Error('printable resume link missing');

const htmlSource = path.join(rootDir, 'assets/downloads/michael-costea-resume-2026.html');
if (!fs.existsSync(htmlSource)) throw new Error('ATS resume HTML source missing');
const printableHtml = fs.readFileSync(htmlSource, 'utf8');
const printableDocument = new JSDOM(printableHtml).window.document;
const printableText = printableDocument.body.textContent.replace(/\s+/g, ' ').trim();
for (const project of [
  'Codex Account Usage + Auth Rotator',
  'Automated Social Life & Brand Engine',
  'Brief2Ship',
  'RebateSignal',
]) {
  if (!printableText.includes(project)) throw new Error(`printable resume missing requested project: ${project}`);
}
if (printableDocument.querySelectorAll('.selected-project').length !== 4) {
  throw new Error('printable resume must contain exactly four selected-project cards');
}
for (const forbidden of [
  'Selected systems, project screenshots, operating diagrams and public work',
  'Public agent-observability project',
  'telegram-office',
]) {
  if (printableHtml.includes(forbidden)) throw new Error(`printable resume still contains rejected portfolio copy: ${forbidden}`);
}

for (const marker of ['career-fit-summary', 'career-fit-grid', 'resume-download-row']) {
  if (!careerCss.includes(`.${marker}`)) throw new Error(`resume production CSS missing .${marker}`);
}

console.log('career-positioning-resume-regression ok');
