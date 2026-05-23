#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

function assertMatch(name, regex) {
  if (!regex.test(css)) throw new Error(`${name} missing. Pattern: ${regex}`);
}

assertMatch(
  'mobile CTA icons should be hidden so black-background PNG icon tiles do not appear',
  /\.public-preview\.ux-preview-page \.hero-action-panel \.ui-btn::before\{[^}]*display:none!important/s
);
assertMatch(
  'mobile CTA panel should become simple readable action stack',
  /\.public-preview\.ux-preview-page \.hero-action-panel\{[^}]*background:transparent!important[^}]*border:0!important[^}]*box-shadow:none!important/s
);
assertMatch(
  'mobile decorative reference panels should be hidden',
  /\.public-preview\.ux-preview-page \.reference-ui-panel,\s*\.public-preview\.ux-preview-page \.workflow-output-demo\{[^}]*display:none!important/s
);
assertMatch(
  'mobile proof steps should be simplified with lighter spacing',
  /\.public-preview\.ux-preview-page \.hero-proof-steps li\{[^}]*box-shadow:none!important/s
);
assertMatch(
  'mobile sidebar should not dominate the top of page',
  /body\.mobile-mode\.public-preview\.ux-preview-page \.welcome-sidebar\{[^}]*display:none!important/s
);

console.log('mobile-content-polish-regression ok');
