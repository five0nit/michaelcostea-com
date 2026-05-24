#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'ux-preview.html'), 'utf8');
const css = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;

const entries = [...document.querySelectorAll('#resumeWindow .timeline-list .mini-content-card')];
if (entries.length < 7) throw new Error(`expected resume experience entries, got ${entries.length}`);
for (const entry of entries) {
  if (!entry.querySelector(':scope > h4')) throw new Error('experience entry missing h4');
  if (!entry.querySelector(':scope > .mini-card-figure > img')) throw new Error('experience entry missing mini figure');
  if (entry.querySelectorAll(':scope > p').length < 2 && !/Bloom Coffee|Business Development|Sales Manager|Electrician/.test(entry.textContent)) {
    throw new Error('experience entry missing paragraph content');
  }
}

const expectations = [
  [/\/\* === Resume experience: mobile text wraps beside mini images cleanly === \*\/[\s\S]*#resumeWindow \.timeline-list article\{[^}]*display:block!important/, 'mobile resume entries should use block layout for true text wrap'],
  [/\/\* === Resume experience: mobile text wraps beside mini images cleanly === \*\/[\s\S]*#resumeWindow \.timeline-list \.mini-card-figure\{[^}]*float:right!important/, 'mobile resume mini image should float right'],
  [/body\.mobile-mode\.public-preview #resumeWindow \.timeline-list p:nth-of-type\(2\)\{[^}]*clear:none!important/, 'mobile-mode resume main role paragraph should override legacy full-width clear'],
  [/\/\* === Resume experience: mobile text wraps beside mini images cleanly === \*\/[\s\S]*#resumeWindow \.timeline-list p:first-of-type\{[^}]*clear:both!important/, 'mobile resume date row should stay full-width before image'],
  [/\/\* === Resume experience: mobile text wraps beside mini images cleanly === \*\/[\s\S]*#resumeWindow \.timeline-list p:nth-of-type\(n\+3\)\{[^}]*clear:both!important/, 'extra impact paragraphs should clear after wrapped intro'],
];
for (const [regex, message] of expectations) {
  if (!regex.test(css)) throw new Error(message);
}

console.log('resume-experience-wrap-regression ok');
