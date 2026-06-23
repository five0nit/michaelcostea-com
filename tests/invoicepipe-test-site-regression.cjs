#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.resolve(__dirname, '..');
const pagePath = path.join(rootDir, 'invoicepipe.html');

if (!fs.existsSync(pagePath)) {
  throw new Error('missing invoicepipe.html test site page');
}

const html = fs.readFileSync(pagePath, 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;

function text() {
  return document.body.textContent.replace(/\s+/g, ' ').trim();
}
function attr(selector, name) {
  const value = document.querySelector(selector)?.getAttribute(name) || '';
  if (!value) throw new Error(`missing ${selector} ${name}`);
  return value;
}

if (document.title !== 'BillPilot — Australian invoice automation pilot') {
  throw new Error(`unexpected title: ${document.title}`);
}
if (attr('link[rel="canonical"]', 'href') !== 'https://michaelcostea.com/invoicepipe.html') {
  throw new Error('canonical must point at the michaelcostea.com test subpage');
}
if (!attr('meta[name="robots"]', 'content').includes('noindex')) {
  throw new Error('test site must remain noindex until public launch approval');
}
if (!document.body.classList.contains('invoicepipe-test-site')) {
  throw new Error('body must carry invoicepipe-test-site class');
}

const bodyText = text();
for (const phrase of [
  'BillPilot',
  'Australian invoice PDFs → accounting-ready data',
  '14-Day AP Automation Pilot',
  'shared mailbox',
  'Vendor + ABN',
  'Invoice number + dates',
  'PO + document type',
  'Subtotal + GST + total',
  'Exception report',
  'from AUD $750',
  'Book a pilot',
  'Owner/developer access is confirmed for commercial use and selling',
]) {
  if (!bodyText.includes(phrase)) throw new Error(`missing launch phrase: ${phrase}`);
}

const processSteps = [...document.querySelectorAll('.ip-step')];
if (processSteps.length !== 4) {
  throw new Error(`expected 4 workflow steps, got ${processSteps.length}`);
}

const mailto = attr('a.ip-primary-cta', 'href');
if (!mailto.startsWith('mailto:costea.michael@gmail.com')) {
  throw new Error('primary CTA should mail Michael');
}
const decoded = decodeURIComponent(mailto);
for (const prompt of ['Invoice volume', 'Where invoices arrive', 'Output needed', 'Sample batch']) {
  if (!decoded.includes(prompt)) throw new Error(`mailto brief missing ${prompt}`);
}


const aliasPath = path.join(rootDir, 'billpilot.html');
if (!fs.existsSync(aliasPath)) {
  throw new Error('missing billpilot.html clean alias page');
}
const aliasHtml = fs.readFileSync(aliasPath, 'utf8');
const aliasDom = new JSDOM(aliasHtml);
const aliasDocument = aliasDom.window.document;
const aliasText = aliasDocument.body.textContent.replace(/\s+/g, ' ').trim();
if (aliasDocument.title !== 'BillPilot — Australian invoice automation pilot') {
  throw new Error(`unexpected BillPilot alias title: ${aliasDocument.title}`);
}
if ((aliasDocument.querySelector('link[rel="canonical"]')?.getAttribute('href') || '') !== 'https://michaelcostea.com/billpilot.html') {
  throw new Error('BillPilot alias canonical must point at /billpilot.html');
}
if (!aliasHtml.includes('href="/billpilot.html"')) {
  throw new Error('BillPilot alias logo should link to /billpilot.html');
}
if (!aliasText.includes('BillPilot test package · michaelcostea.com/billpilot.html')) {
  throw new Error('BillPilot alias footer should show clean /billpilot.html URL');
}
if (!aliasText.includes('Australian invoice PDFs → accounting-ready data')) {
  throw new Error('BillPilot alias missing main positioning');
}

console.log('invoicepipe-test-site-regression ok');
