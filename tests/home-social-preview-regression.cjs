#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const document = new JSDOM(html).window.document;
const expectedUrl = 'https://michaelcostea.com/assets/social/michaelcostea-welcome-screen-20260902.png';
const expectedAlt = 'Michael Costea’s Michael OS portfolio open on the Welcome.exe AI Employee Systems home screen';
const must = (condition, message) => { if (!condition) throw new Error(message); };
const meta = (selector) => document.querySelector(selector)?.getAttribute('content') || '';

must(meta('meta[property="og:type"]') === 'website', 'homepage og:type must be website');
must(meta('meta[property="og:locale"]') === 'en_AU', 'homepage og:locale must be en_AU');
must(meta('meta[property="og:image"]') === expectedUrl, 'og:image must use the welcome-screen social preview');
must(meta('meta[property="og:image:secure_url"]') === expectedUrl, 'og:image:secure_url must match the welcome-screen preview');
must(meta('meta[property="og:image:type"]') === 'image/png', 'og:image:type must be image/png');
must(meta('meta[property="og:image:width"]') === '1200', 'og:image width must be 1200');
must(meta('meta[property="og:image:height"]') === '630', 'og:image height must be 630');
must(meta('meta[property="og:image:alt"]') === expectedAlt, 'og:image alt must describe the welcome screen');
must(meta('meta[name="twitter:card"]') === 'summary_large_image', 'Twitter card must be large image');
must(meta('meta[name="twitter:image"]') === expectedUrl, 'twitter:image must match the welcome-screen preview');
must(meta('meta[name="twitter:image:alt"]') === expectedAlt, 'twitter:image:alt must describe the welcome screen');

const imagePath = path.join(root, 'assets/social/michaelcostea-welcome-screen-20260902.png');
must(fs.existsSync(imagePath), `social preview missing: ${imagePath}`);
const png = fs.readFileSync(imagePath);
must(png.length >= 24 && png.subarray(1, 4).toString('ascii') === 'PNG', 'social preview must be a valid PNG');
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
must(width === 1200 && height === 630, `social preview must be 1200x630, got ${width}x${height}`);
must(png.length < 5 * 1024 * 1024, 'social preview must stay below 5 MiB');

console.log('home-social-preview-regression ok');
