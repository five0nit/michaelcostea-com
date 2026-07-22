#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const exists = (...parts) => fs.existsSync(path.join(root, ...parts));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const app = read('signalpost', 'index.html');
const js = read('signalpost', 'app.js');
const css = read('signalpost', 'styles.css');
const privacy = read('signalpost', 'privacy', 'index.html');
const terms = read('signalpost', 'terms', 'index.html');
const support = read('signalpost', 'support', 'index.html');
const callback = read('tiktok', 'callback', 'callback.js');
const callbackHtml = read('tiktok', 'callback', 'index.html');
const backend = read('tiktok-publisher-api', 'index.js');
const validation = read('tiktok-publisher-api', 'validation.js');
const sitemap = read('sitemap.xml');

for (const file of [
  ['assets', 'signalpost', 'signalpost-icon.svg'],
  ['assets', 'signalpost', 'signalpost-icon-1024.png'],
  ['assets', 'signalpost', 'signalpost-icon-512.png'],
  ['assets', 'signalpost', 'signalpost-icon-192.png'],
  ['assets', 'signalpost', 'signalpost-icon-32.png'],
]) assert(exists(...file), `missing ${file.join('/')}`);

assert(/<title>SignalPost[^<]*<\/title>/i.test(app), 'app title must use SignalPost');
assert(/name="description"[^>]+independent creators/i.test(app), 'app needs public product description');
assert(/name="robots"\s+content="index,follow"/i.test(app), 'app must be indexable');
assert(app.includes('Publish original videos to your own TikTok profile'), 'app must state genuine use case');
assert(app.includes('id="connectTikTok"'), 'connect control missing');
assert(app.includes('id="videoFile"') && /accept="video\/mp4/i.test(app), 'MP4 picker missing');
assert(app.includes('id="videoPreview"'), 'video preview missing');
assert(app.includes('id="postTitle"'), 'editable title missing');
assert(/<select[^>]+id="privacyLevel"[\s\S]*?<option value="">Choose privacy/i.test(app), 'privacy must begin unselected');
assert(!/<option[^>]+selected[^>]*>[^<]*(Public|Friends|Private|Self)/i.test(app), 'privacy must not be preset');
for (const id of ['allowComment', 'allowDuet', 'allowStitch', 'commercialDisclosure', 'brandOrganic', 'brandContent', 'commercialNotice', 'musicAgreement', 'publishConsent']) {
  assert(app.includes(`id="${id}"`), `required TikTok control missing: ${id}`);
}
assert(app.includes('id="publishButton"'), 'explicit publish control missing');
assert(app.includes('id="disconnectButton"'), 'disconnect/data deletion control missing');
for (const href of ['./privacy/', './terms/', './support/']) assert(app.includes(`href="${href}"`), `visible legal/support link missing: ${href}`);
assert(!/personal uploader|internal uploader|local social engine/i.test(app), 'public app must not be framed as an internal/personal utility');
assert(!/guaranteed approval|approved by TikTok|official TikTok partner/i.test(app), 'app must not claim unsupported approval');

assert(js.includes('https://us-central1-idontknowhowtoai.cloudfunctions.net/signalPostApi'), 'production API endpoint missing');
assert(js.includes('sessionStorage'), 'session must be tab-scoped');
assert(js.includes('crypto.subtle.digest') && js.includes('signalpost_pkce_verifier'), 'browser-bound PKCE verifier missing');
assert(js.includes("api('session-exchange'") && js.includes('exchange_code'), 'one-time callback exchange missing');
assert(!/fragment\.get\(['\"]session|returnedSession/i.test(js), 'reusable bearer must not be imported from a URL fragment');
assert(js.includes("api('publish-intent'") && js.includes('intent_token'), 'single-use exact-payload publish intent missing');
assert(js.includes('musicAgreement.checked = false') && js.includes('publishConsent.checked = false'), 'fresh confirmations must be cleared after each attempt');
assert(!js.includes('localStorage'), 'bearer session must not persist in localStorage');
assert(!/client_secret|refresh_token|access_token/i.test(js), 'browser code must not contain provider secret/token fields');
assert(js.includes('FormData'), 'publisher must upload selected media');
assert(js.includes('videoPreview.src'), 'selected media must be previewed');
assert(js.includes('privacy_level_options'), 'privacy options must come from creator info');
assert(js.includes('comment_disabled') && js.includes('duet_disabled') && js.includes('stitch_disabled'), 'interaction gates must come from creator info');
assert(js.includes('musicAgreement') && js.includes('publishConsent'), 'explicit agreements must gate publish');
assert(app.includes('https://www.tiktok.com/legal/page/global/music-usage-confirmation/en') && app.includes('https://www.tiktok.com/legal/page/global/bc-policy/en'), 'official TikTok music and branded-content policy links missing');
assert(js.includes('commercialDisclosure') && js.includes('Branded content visibility cannot be set to private'), 'commercial disclosure state/warning logic missing');
assert(css.includes('@media (max-width: 720px)'), 'mobile layout missing');
assert(css.includes(':focus-visible'), 'keyboard focus treatment missing');

for (const [name, page] of [['privacy', privacy], ['terms', terms], ['support', support]]) {
  assert(/<title>SignalPost/i.test(page), `${name} title missing`);
  assert(page.includes('href="../"'), `${name} must link back to app`);
  assert(/Last updated:\s*22 July 2026/i.test(page), `${name} effective date missing`);
}
for (const phrase of ['TikTok access token', 'retention', 'delete', 'Google Cloud', 'not sell']) assert(privacy.toLowerCase().includes(phrase.toLowerCase()), `privacy missing: ${phrase}`);
for (const phrase of ['original content', 'TikTok', 'prohibited', 'consent', 'terminate']) assert(terms.toLowerCase().includes(phrase.toLowerCase()), `terms missing: ${phrase}`);
for (const phrase of ['costea.michael@gmail.com', 'account connection', 'data deletion']) assert(support.toLowerCase().includes(phrase.toLowerCase()), `support missing: ${phrase}`);

assert(callback.includes("state.startsWith('sp_')"), 'callback must identify SignalPost OAuth state');
assert(callback.includes('/signalpost/#') && callback.includes('{ exchange_code: payload.exchange_code }'), 'callback must return only a one-time exchange code via URL fragment');
assert(!callback.includes('{ session: payload.session }'), 'callback must not expose a reusable bearer session');
assert(callback.includes('http://127.0.0.1:8767/callback'), 'legacy local relay must remain available');
assert(!callback.includes('localStorage'), 'callback must not persist OAuth response');
assert(/no-referrer/i.test(callbackHtml), 'callback referrer suppression missing');

assert(backend.includes("defineBoolean('SIGNALPOST_PUBLIC_POSTING_ENABLED'") && backend.includes('allowedPrivacyOptions'), 'server-enforced default-off public-post gate missing');
assert(backend.includes("route === 'session-exchange'") && backend.includes('pkceChallenge'), 'PKCE-bound one-time session exchange route missing');
assert(backend.includes("route === 'publish-intent'") && backend.includes('canonicalPublishFingerprint'), 'single-use exact-payload publish intent route missing');
assert(backend.includes('runTransaction') && backend.includes('intent_already_used'), 'atomic intent/rate controls missing');
assert(backend.includes("ref('publishIds'") && validation.includes('isSafePublishId'), 'opaque provider IDs must be account-bound');
assert(backend.includes('signalPostCleanup') && backend.includes('onSchedule'), 'scheduled retention enforcement missing');
assert(backend.includes('provider_revoke_confirmed') && backend.includes('stored_credentials_deleted'), 'disconnect must report provider and local deletion separately');
assert(validation.includes('looksLikeMp4') && backend.includes('looksLikeMp4(video.buffer)'), 'MP4 signature validation missing');
assert(validation.includes('sanitizeProviderReceipt') && validation.includes('[REDACTED]'), 'recursive receipt redaction missing');

const sitemapRoutes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
for (const route of [
  'https://michaelcostea.com/signalpost/',
  'https://michaelcostea.com/signalpost/privacy/',
  'https://michaelcostea.com/signalpost/terms/',
  'https://michaelcostea.com/signalpost/support/',
]) {
  assert(sitemapRoutes.filter(value => value === route).length === 1, `sitemap must contain route exactly once: ${route}`);
}

console.log('signalpost-regression ok');
