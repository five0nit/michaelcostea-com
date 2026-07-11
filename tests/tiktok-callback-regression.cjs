#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'tiktok', 'callback', 'index.html');
const jsPath = path.join(root, 'tiktok', 'callback', 'callback.js');
const html = fs.readFileSync(htmlPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html), 'callback must be noindex');
assert(/<meta\s+name="referrer"\s+content="no-referrer"/i.test(html), 'callback must suppress referrers');
assert(/<script\s+src="\.\/callback\.js"><\/script>/i.test(html), 'callback must use external relay script');
assert(js.includes('http://127.0.0.1:8767/callback'), 'relay must target the local Social Engine');
assert(js.includes('["code", "state", "error", "error_description"]'), 'relay must allowlist OAuth response fields');
assert(!js.includes('localStorage') && !js.includes('sessionStorage'), 'relay must not persist OAuth data');
assert(!html.includes('analytics') && !html.includes('gtag('), 'callback must not load analytics');

console.log('tiktok-callback-regression ok');
