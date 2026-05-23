const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('ux-preview.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');

assert(
  /<a\s+class="skip-link"\s+href="#readerWindow">Skip to portfolio content<\/a>/.test(html),
  'homepage should provide a visible-on-focus skip link to the main portfolio content'
);

assert(
  /<section\s+id="readerWindow"[^>]*tabindex="-1"/.test(html),
  'readerWindow should be programmatically focusable as the skip-link target'
);

assert(
  /\.skip-link\{[^}]*position:fixed[^}]*transform:translateY\(-140%\)[^}]*z-index:120/.test(css),
  'skip link should be off-canvas until focused and above desktop windows'
);

assert(
  /\.skip-link:focus-visible\{[^}]*transform:translateY\(0\)[^}]*outline:3px solid #fff4c2/.test(css),
  'skip link should become clearly visible for keyboard users'
);

console.log('accessibility-navigation-regression ok');
