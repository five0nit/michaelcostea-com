const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateOrigin,
  validatePublishFields,
  allowedPrivacyOptions,
  providerError,
  sanitizeProviderReceipt,
  parseBearer,
  utf16Length,
  canonicalPublishFingerprint,
  looksLikeMp4,
  isSafePublishId,
  pkceChallenge,
  validPkceVerifier,
  publicProviderMessage,
} = require('../validation');

test('origin allowlist accepts production and local QA only', () => {
  assert.equal(validateOrigin('https://michaelcostea.com'), true);
  assert.equal(validateOrigin('http://127.0.0.1:4173'), true);
  assert.equal(validateOrigin('https://evil.example'), false);
  assert.equal(validateOrigin('null'), false);
});

test('public privacy is server-blocked until audited live gate is enabled', () => {
  const provider = ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'];
  assert.deepEqual(allowedPrivacyOptions(provider, false), ['SELF_ONLY']);
  assert.deepEqual(allowedPrivacyOptions(provider, true), provider);
});

test('privacy selection and explicit agreements are mandatory', () => {
  assert.throws(() => validatePublishFields({ title: 'Test', privacy_level: '', music_agreement: 'true', publish_consent: 'true' }, ['PUBLIC_TO_EVERYONE']), /privacy/i);
  assert.throws(() => validatePublishFields({ title: 'Test', privacy_level: 'PUBLIC_TO_EVERYONE', music_agreement: 'false', publish_consent: 'true' }, ['PUBLIC_TO_EVERYONE']), /music/i);
  assert.throws(() => validatePublishFields({ title: 'Test', privacy_level: 'PUBLIC_TO_EVERYONE', music_agreement: 'true', publish_consent: 'false' }, ['PUBLIC_TO_EVERYONE']), /consent/i);
  assert.throws(() => validatePublishFields({ title: 'Test', privacy_level: 'FRIENDS_ONLY', music_agreement: 'true', publish_consent: 'true' }, ['PUBLIC_TO_EVERYONE']), /available/i);
});

test('commercial disclosure requires a category and branded content cannot be private', () => {
  const base = { title: 'Test', privacy_level: 'SELF_ONLY', music_agreement: 'true', publish_consent: 'true' };
  assert.throws(() => validatePublishFields({ ...base, commercial_disclosure: 'true' }, ['SELF_ONLY']), /brand category/i);
  assert.throws(() => validatePublishFields({ ...base, commercial_disclosure: 'true', brand_content: 'true' }, ['SELF_ONLY']), /cannot be private/i);
  assert.throws(() => validatePublishFields({ ...base, commercial_disclosure: 'false', brand_organic: 'true' }, ['SELF_ONLY']), /toggle/i);
});

test('valid publish fields are normalized with explicit booleans', () => {
  const result = validatePublishFields({
    title: '  Original creator update  ', privacy_level: 'PUBLIC_TO_EVERYONE', allow_comment: 'true', allow_duet: 'false',
    allow_stitch: 'true', commercial_disclosure: 'true', brand_organic: 'true', brand_content: 'false',
    music_agreement: 'true', publish_consent: 'true',
  }, ['PUBLIC_TO_EVERYONE']);
  assert.equal(result.title, 'Original creator update');
  assert.equal(result.allow_comment, true);
  assert.equal(result.allow_duet, false);
  assert.equal(result.allow_stitch, true);
  assert.equal(result.brand_organic_toggle, true);
});

test('title is capped by UTF-16 code units', () => {
  assert.equal(utf16Length('😀'), 2);
  assert.throws(() => validatePublishFields({ title: 'a'.repeat(2201), privacy_level: 'SELF_ONLY', music_agreement: 'true', publish_consent: 'true' }, ['SELF_ONLY']), /2200/);
});

test('exact publish fingerprint is stable and payload bound', () => {
  const fields = { title: 'A', privacy_level: 'SELF_ONLY', publish_consent: 'true', music_agreement: 'true' };
  const one = canonicalPublishFingerprint(fields, 'a'.repeat(64), 1234);
  const two = canonicalPublishFingerprint({ ...fields }, 'a'.repeat(64), 1234);
  const changed = canonicalPublishFingerprint({ ...fields, title: 'B' }, 'a'.repeat(64), 1234);
  assert.equal(one, two);
  assert.notEqual(one, changed);
  assert.match(one, /^[a-f0-9]{64}$/);
});

test('MP4 signature validation requires an ftyp box', () => {
  assert.equal(looksLikeMp4(Buffer.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d])), true);
  assert.equal(looksLikeMp4(Buffer.from('not an mp4')), false);
});

test('opaque publish IDs are bounded and safe', () => {
  assert.equal(isSafePublishId('v_pub_file~v2.123:abc-DEF'), true);
  assert.equal(isSafePublishId(''), false);
  assert.equal(isSafePublishId('../secret'), false);
  assert.equal(isSafePublishId('a'.repeat(129)), false);
});

test('PKCE verifier and challenge are strict', () => {
  const verifier = 'A'.repeat(64);
  assert.equal(validPkceVerifier(verifier), true);
  assert.equal(validPkceVerifier('short'), false);
  assert.match(pkceChallenge(verifier), /^[A-Za-z0-9_-]{43}$/);
});

test('provider semantic error is detected even on HTTP success', () => {
  const err = providerError({ error: { code: 'unaudited_client_can_only_post_to_private_accounts', message: 'blocked', log_id: 'abc' } });
  assert.equal(err.code, 'unaudited_client_can_only_post_to_private_accounts');
  assert.equal(providerError({ error: { code: 'ok', message: '', log_id: 'abc' }, data: { publish_id: '123' } }), null);
});

test('provider receipt recursively strips secret-bearing fields', () => {
  const clean = sanitizeProviderReceipt({
    data: { publish_id: '123', nested: { upload_url: 'https://upload.example/secret', access_token: 'secret' } },
    access_token: 'secret', refresh_token: 'secret2', error: { code: 'ok', log_id: 'log' },
  });
  assert.equal(clean.data.publish_id, '123');
  assert.equal(clean.data.nested.upload_url, '[REDACTED]');
  assert.equal(clean.data.nested.access_token, '[REDACTED]');
  assert.equal(clean.access_token, '[REDACTED]');
  assert.equal(clean.refresh_token, '[REDACTED]');
});

test('provider-facing messages are allowlisted', () => {
  assert.match(publicProviderMessage('unaudited_client_can_only_post_to_private_accounts'), /app review/i);
  assert.equal(publicProviderMessage('provider-injected-secret-message'), 'TikTok could not complete this request. Try again or contact support with the visible error code.');
});

test('bearer parsing is strict', () => {
  assert.equal(parseBearer('Bearer abc-123'), 'abc-123');
  assert.equal(parseBearer('bearer abc'), '');
  assert.equal(parseBearer('Basic abc'), '');
});
