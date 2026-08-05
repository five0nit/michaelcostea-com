const assert = require('node:assert/strict');
const { existsSync, readFileSync, readdirSync, statSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const mini = path.join(root, 'mini');
const html = readFileSync(path.join(mini, 'index.html'), 'utf8');
const assets = JSON.parse(readFileSync(path.join(mini, 'assets.json'), 'utf8'));
const sitemap = readFileSync(path.join(root, 'sitemap.xml'), 'utf8');

assert.match(html, /<html lang="en" data-app-base="\/mini">/);
assert.match(html, /<body class="hyperframes-live">/);
assert.match(html, /<link rel="canonical" href="https:\/\/michaelcostea\.com\/mini\/" \/>/);
assert.match(html, /href="\/mini\/hyperframes-live\.css\?v=20260805-live-1"/);
assert.match(html, /src="\/mini\/app\.js"/);
assert.match(html, /href="\/mini\/icons\/michaelos-sprite\.svg#icon-folder"/);
assert.match(html, /href="https:\/\/minimemichael\.web\.app\/admin\.html"/);
assert.doesNotMatch(html, /LOCAL STYLE PREVIEW|noindex,nofollow/);
assert.equal(assets.length, 655);
assert.equal(assets.filter((asset) => asset.collectionId === 'v2-designs').length, 277);
assert.match(html, /data-collection="v2-designs"/);
assert.match(readFileSync(path.join(mini, 'app.js'), 'utf8'), /asset-collection-badge/);
assert.ok(assets.every((asset) => asset.url.startsWith('https://minimemichael.web.app/mini-assets/')));
assert.equal(existsSync(path.join(mini, 'mini-assets')), false);
assert.equal(existsSync(path.join(mini, 'admin.html')), false);
assert.equal(existsSync(path.join(mini, 'admin.js')), false);
assert.equal((sitemap.match(/https:\/\/michaelcostea\.com\/mini\//g) ?? []).length, 1);

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? files(full) : [full];
  });
}
const shipped = files(mini);
assert.equal(shipped.some((file) => file.endsWith('.map')), false);
assert.equal(shipped.some((file) => /\.(png|jpe?g|webp)$/i.test(file)), false);
assert.ok(shipped.reduce((total, file) => total + statSync(file).size, 0) < 10_000_000);

console.log(JSON.stringify({
  route: 'https://michaelcostea.com/mini/',
  files: shipped.length,
  catalogRecords: assets.length,
  copiedImageBinaries: 0,
}, null, 2));
