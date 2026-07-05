#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function must(condition, message) {
  if (!condition) throw new Error(message);
}

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

must(html.includes('id="recycleBin"'), 'desktop should include Recycle Bin icon');
must(html.includes('data-open="recycleWindow"'), 'Recycle Bin icon should open recycleWindow');

const desktopIconsRule = css.match(/\.public-preview \.desktop-icons\{[^}]+\}/)?.[0] || '';
must(desktopIconsRule.includes('flex-wrap:wrap'), 'desktop icon stack should wrap instead of pushing Recycle Bin below the hidden viewport');
must(/height:calc\(100dvh - 120px\)/.test(desktopIconsRule), 'desktop icon stack should have a viewport-bounded wrap height');
must(/width:204px/.test(desktopIconsRule), 'desktop icon stack should reserve enough desktop width for a second column');

const welcomeWindowRule = css.match(/\.public-preview \.main-portfolio-window\{[^}]+\}/)?.[0] || '';
must(!welcomeWindowRule.includes('display:block'), 'closed Welcome window should not keep display:block and cover desktop icons');
must(css.includes('.public-preview .main-portfolio-window.open{display:block;}'), 'Welcome window should only force block display while open');

console.log('desktop-recycle-bin-visibility-regression ok');
