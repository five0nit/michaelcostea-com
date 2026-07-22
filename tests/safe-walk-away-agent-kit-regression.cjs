#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const page = path.join(root, 'safe-walk-away-agent-kit.html');
if (!fs.existsSync(page)) throw new Error('missing safe-walk-away-agent-kit.html');

const html = fs.readFileSync(page, 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;
const body = document.body.textContent.replace(/\s+/g, ' ').trim();
const attr = (selector, name) => document.querySelector(selector)?.getAttribute(name) || '';
const guidePath = 'guides/ai-agent-execution-receipt-template/?utm_source=safe_walk_away_landing&utm_medium=owned_content&utm_campaign=safe_walk_away_launch';
const socialImageUrl = 'https://michaelcostea.com/assets/products/safe-walk-away-social-card.png';

if (document.title !== 'Safe Walk-Away Agent Kit — bounded Claude Code autonomy') {
  throw new Error(`unexpected title: ${document.title}`);
}
if (attr('link[rel="canonical"]', 'href') !== 'https://michaelcostea.com/safe-walk-away-agent-kit.html') {
  throw new Error('wrong canonical');
}
if (attr('meta[name="robots"]', 'content') !== 'index, follow') {
  throw new Error('live page must be indexable after checkout verification');
}
if (attr('meta[property="og:image"]', 'content') !== socialImageUrl) {
  throw new Error('wrong Open Graph image');
}
if (attr('meta[property="og:image:width"]', 'content') !== '1600' || attr('meta[property="og:image:height"]', 'content') !== '900') {
  throw new Error('wrong Open Graph image dimensions');
}
if (!attr('meta[property="og:image:alt"]', 'content')) {
  throw new Error('Open Graph image alt missing');
}
if (attr('meta[name="twitter:card"]', 'content') !== 'summary_large_image' || attr('meta[name="twitter:image"]', 'content') !== socialImageUrl || !attr('meta[name="twitter:image:alt"]', 'content')) {
  throw new Error('Twitter social card contract incorrect');
}
const socialImagePath = path.join(root, 'assets/products/safe-walk-away-social-card.png');
if (!fs.existsSync(socialImagePath) || fs.statSync(socialImagePath).size < 100000) {
  throw new Error('landing social image missing or unexpectedly small');
}
if (document.body.dataset.launchStatus !== 'live') {
  throw new Error('missing truthful live status');
}
if (document.body.dataset.standardCheckoutUrl !== 'https://costeamichael.gumroad.com/l/safe-walk-away-agent-kit') {
  throw new Error('wrong staged standard checkout URL');
}
if (document.body.dataset.launchCheckoutUrl !== 'https://costeamichael.gumroad.com/l/safe-walk-away-agent-kit/WALKAWAY5') {
  throw new Error('wrong staged launch checkout URL');
}

for (const phrase of [
  'Safe Walk-Away Agent Kit',
  'Claude Code-first',
  'US$19',
  'US$5 launch product price · first 10 buyers',
  'Code WALKAWAY5',
  'before applicable taxes',
  'Permission profile generator',
  'High-risk action gate',
  'Scope-expansion stop',
  'Execution receipts',
  'Guardrail, not a sandbox',
  'No security or compliance guarantee',
  'Build agent autonomy with receipts, not vibes.',
  'Get launch price — US$5',
  'Live · buyer checkout verified · automatic delivery staged',
  '14-day description-match refund policy',
  'Free: use the execution receipt template',
]) {
  if (!body.includes(phrase)) throw new Error(`missing product phrase: ${phrase}`);
}

const steps = [...document.querySelectorAll('.how-step')];
if (steps.length !== 3) throw new Error(`expected 3 steps, got ${steps.length}`);
const proof = [...document.querySelectorAll('.proof-item')];
if (proof.length < 4) throw new Error('expected at least 4 proof items');
const cta = document.querySelector('a.primary-cta');
if (!cta || cta.getAttribute('href') !== 'https://costeamichael.gumroad.com/l/safe-walk-away-agent-kit/WALKAWAY5') {
  throw new Error('live CTA must use the verified discounted checkout URL');
}
if (cta.hasAttribute('aria-disabled')) {
  throw new Error('live CTA must not be marked disabled');
}
if (cta.dataset.analyticsEvent !== 'begin_checkout' || cta.dataset.analyticsItemId !== 'safe_walk_away_agent_kit') {
  throw new Error('live CTA analytics contract incorrect');
}
const resource = document.querySelector('a.resource-cta');
if (!resource || resource.getAttribute('href') !== guidePath || resource.dataset.analyticsEvent !== 'select_content' || resource.dataset.analyticsItemId !== 'execution_receipt_guide') {
  throw new Error('execution receipt guide path incorrect');
}
const measured = [...document.querySelectorAll('[data-analytics-event]')];
if (measured.length !== 2 || measured.some(element => !element.dataset.analyticsItemId)) {
  throw new Error('landing analytics element contract incorrect');
}
if (!html.includes('allow_google_signals: false') || !html.includes('allow_ad_personalization_signals: false')) {
  throw new Error('analytics privacy flags missing');
}
const homepageHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const homepage = new JSDOM(homepageHtml).window.document;
const ownedGuidePath = homepage.querySelector('a[data-owned-path="safe-walk-away-receipt-guide"]');
const expectedOwnedGuidePath = 'guides/ai-agent-execution-receipt-template/?utm_source=michaelcostea.com&utm_medium=owned_homepage&utm_campaign=safe_walk_away_launch';
if (!ownedGuidePath || ownedGuidePath.getAttribute('href') !== expectedOwnedGuidePath || ownedGuidePath.textContent.trim() !== 'Use the free template') {
  throw new Error('qualified homepage-to-guide path missing or incorrect');
}
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
if (!sitemap.includes('<loc>https://michaelcostea.com/guides/ai-agent-execution-receipt-template/</loc>')) {
  throw new Error('sitemap missing execution receipt guide');
}
const support = attr('a.support-link', 'href');
if (!support.startsWith('mailto:costea.michael@gmail.com')) {
  throw new Error('support link must use existing public support email');
}
for (const privateMarker of ['/home/', '.hermes/', 'eafb30d4f2d7', 'UC7C6nJ9Lfjz0gMO6y0pjDHg']) {
  if (html.includes(privateMarker)) throw new Error(`private marker leaked: ${privateMarker}`);
}
if (!html.includes('@media (max-width: 720px)')) throw new Error('mobile breakpoint missing');

console.log('safe-walk-away-agent-kit-regression ok');
