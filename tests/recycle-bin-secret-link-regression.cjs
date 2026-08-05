#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function must(condition, message) {
  if (!condition) throw new Error(message);
}

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
must(
  /styles\.css\?v=[^"\s]+/.test(html),
  'homepage should cache-bust the shared stylesheet so Recycle Bin styling updates reach browsers'
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
  recycleWindow.includes('<b>Mini Michael</b>'),
  'Recycle Bin should include the Mini Michael app label'
);
must(
  recycleWindow.includes('href="/mini/"'),
  'Mini Michael link should point to the local /mini/ gallery route'
);
must(
  /<a[^>]+class="[^"]*secret-app-link[^"]*"[^>]+href="\/mini\/"[^>]+target="_blank"[^>]+rel="noopener"[^>]*>/.test(recycleWindow),
  'Mini Michael should use the recovered app card pattern and open safely in a new tab'
);
must(
  recycleWindow.includes('378-image asset library'),
  'Mini Michael launcher should explain that it opens the image library'
);
must(
  recycleWindow.includes('target="_blank"') && recycleWindow.includes('rel="noopener"'),
  'secret external app link should open safely in a new tab'
);

console.log('Recycle Bin secret app link regression passed');
