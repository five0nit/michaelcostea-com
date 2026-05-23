#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');

function assertMatch(name, regex) {
  if (!regex.test(css)) throw new Error(`${name} missing. Pattern: ${regex}`);
}

assertMatch(
  'mobile UX preview taskbar should not wrap into stacked rows',
  /\.public-preview\.ux-preview-page \.taskbar\{[^}]*flex-wrap:nowrap[^}]*overflow-x:auto/s
);
assertMatch(
  'mobile UX preview should hide decorative OS brand to keep one-row taskbar',
  /\.public-preview\.ux-preview-page \.ux-taskbar-brand\{[^}]*display:none!important/s
);
assertMatch(
  'mobile UX preview should hide SYS tray chip to keep one-row taskbar',
  /\.public-preview\.ux-preview-page \.ux-tray-status\{[^}]*display:none!important/s
);
assertMatch(
  'mobile start menu should dock to the taskbar instead of floating as a loose window',
  /\.public-preview\.ux-preview-page \.start-menu\{[^}]*left:0!important[^}]*right:0!important[^}]*bottom:calc\(54px \+ env\(safe-area-inset-bottom,0px\)\)!important[^}]*border-bottom:0!important/s
);
assertMatch(
  'UX preview Start button should not show the extra pseudo logo beside Start',
  /\.public-preview\.ux-preview-page \.start-btn::before\{[^}]*content:none!important[^}]*display:none!important/s
);
assertMatch(
  'mobile start menu items should scroll instead of cutting off recycle bin',
  /\.public-preview\.ux-preview-page \.start-items\{[^}]*max-height:calc\(100dvh - 260px\)[^}]*overflow-y:auto/s
);
assertMatch(
  'mobile preview content should reserve enough bottom space for fake taskbar and phone nav',
  /\.public-preview\.ux-preview-page \.container\{[^}]*padding-bottom:calc\(136px \+ env\(safe-area-inset-bottom,0px\)\)/s
);

console.log('mobile-bottom-ux-regression ok');
