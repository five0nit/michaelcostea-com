#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function must(condition, message) {
  if (!condition) throw new Error(message);
}

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
must(
  html.includes('styles.css?v=20260705-desktop-recycle-visible'),
  'homepage should cache-bust stylesheet for Recycle Bin secret app styling'
);
const recycleMatch = html.match(/<section id="recycleWindow"[\s\S]*?<\/section>/);
must(recycleMatch, 'missing Recycle Bin window');
const recycleWindow = recycleMatch[0];

must(
  recycleWindow.includes('Degenerate Shit'),
  'Recycle Bin should include the secret Degenerate Shit app label'
);
must(
  recycleWindow.includes('href="https://michaelcostea.com/ops/pnl-console/"'),
  'Degenerate Shit link should point to the hidden PNL console'
);
must(
  /<a[^>]+class="[^"]*secret-app-link[^"]*"[^>]+href="https:\/\/michaelcostea\.com\/ops\/pnl-console\/"[^>]*>/.test(recycleWindow),
  'secret app link should use the secret-app-link class for styling/regression targeting'
);
must(
  recycleWindow.includes('target="_blank"') && recycleWindow.includes('rel="noopener"'),
  'secret external app link should open safely in a new tab'
);

console.log('Recycle Bin secret app link regression passed');
