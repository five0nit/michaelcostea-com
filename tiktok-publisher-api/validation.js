'use strict';

const crypto = require('node:crypto');

const ALLOWED_ORIGINS = new Set([
  'https://michaelcostea.com',
  'https://www.michaelcostea.com',
  'http://127.0.0.1:4173',
  'http://localhost:4173',
]);
const REDACT_KEY = /(access.?token|refresh.?token|client.?secret|authorization|upload.?url|oauth.?code|session.?token|intent.?token)/i;

function validateOrigin(origin) {
  return ALLOWED_ORIGINS.has(String(origin || ''));
}

function parseBearer(header) {
  const value = String(header || '');
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
}

function asBoolean(value) {
  return value === true || value === 'true';
}

function utf16Length(value) {
  return String(value || '').length;
}

function allowedPrivacyOptions(providerOptions, publicPostingEnabled) {
  const values = Array.isArray(providerOptions) ? providerOptions.filter(value => typeof value === 'string') : [];
  return publicPostingEnabled ? values : values.filter(value => value === 'SELF_ONLY');
}

function validatePublishFields(fields, privacyOptions) {
  const title = String(fields.title || '').trim();
  const privacyLevel = String(fields.privacy_level || '').trim();
  const commercialDisclosure = asBoolean(fields.commercial_disclosure);
  const brandOrganic = asBoolean(fields.brand_organic);
  const brandContent = asBoolean(fields.brand_content);
  if (!title) throw new Error('A title or caption is required');
  if (utf16Length(title) > 2200) throw new Error('Title must be 2200 UTF-16 code units or fewer');
  if (!privacyLevel) throw new Error('Choose a privacy level');
  if (!Array.isArray(privacyOptions) || !privacyOptions.includes(privacyLevel)) {
    throw new Error('Selected privacy level is not available for this creator');
  }
  if (commercialDisclosure && !brandOrganic && !brandContent) {
    throw new Error('Choose at least one commercial brand category');
  }
  if (!commercialDisclosure && (brandOrganic || brandContent)) {
    throw new Error('Commercial brand categories require the disclosure toggle');
  }
  if (brandContent && privacyLevel === 'SELF_ONLY') {
    throw new Error('Branded content visibility cannot be private');
  }
  if (!asBoolean(fields.music_agreement)) throw new Error('Music Usage Confirmation is required');
  if (!asBoolean(fields.publish_consent)) throw new Error('Explicit publish consent is required');
  return {
    title,
    privacy_level: privacyLevel,
    allow_comment: asBoolean(fields.allow_comment),
    allow_duet: asBoolean(fields.allow_duet),
    allow_stitch: asBoolean(fields.allow_stitch),
    brand_organic_toggle: brandOrganic,
    brand_content_toggle: brandContent,
  };
}

function fingerprintPayload(fields, mediaSha256, mediaBytes) {
  return {
    media_sha256: String(mediaSha256 || '').toLowerCase(),
    media_bytes: Number(mediaBytes || 0),
    title: String(fields.title || '').trim(),
    privacy_level: String(fields.privacy_level || '').trim(),
    allow_comment: asBoolean(fields.allow_comment),
    allow_duet: asBoolean(fields.allow_duet),
    allow_stitch: asBoolean(fields.allow_stitch),
    commercial_disclosure: asBoolean(fields.commercial_disclosure),
    brand_organic: asBoolean(fields.brand_organic),
    brand_content: asBoolean(fields.brand_content),
    music_agreement: asBoolean(fields.music_agreement),
    publish_consent: asBoolean(fields.publish_consent),
  };
}

function canonicalPublishFingerprint(fields, mediaSha256, mediaBytes) {
  return crypto.createHash('sha256').update(JSON.stringify(fingerprintPayload(fields, mediaSha256, mediaBytes))).digest('hex');
}

function looksLikeMp4(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
}

function isSafePublishId(value) {
  return /^[A-Za-z0-9._:~-]{1,128}$/.test(String(value || ''));
}

function validPkceVerifier(value) {
  return /^[A-Za-z0-9._~-]{43,128}$/.test(String(value || ''));
}

function pkceChallenge(verifier) {
  if (!validPkceVerifier(verifier)) throw new Error('Invalid PKCE verifier');
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

function providerError(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (typeof payload.error === 'string' && payload.error) {
    return { code: payload.error, message: payload.error_description || payload.error };
  }
  const error = payload.error;
  if (error && typeof error === 'object' && error.code && error.code !== 'ok') {
    return { code: String(error.code), message: String(error.message || error.code), log_id: error.log_id || null };
  }
  return null;
}

function redactRecursive(value, key = '') {
  if (REDACT_KEY.test(key)) return '[REDACTED]';
  if (Array.isArray(value)) return value.map(item => redactRecursive(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, redactRecursive(childValue, childKey)]));
  }
  return value;
}

function sanitizeProviderReceipt(payload) {
  if (!payload || typeof payload !== 'object') return {};
  return redactRecursive(JSON.parse(JSON.stringify(payload)));
}

function publicProviderMessage(code) {
  const messages = {
    unaudited_client_can_only_post_to_private_accounts: 'TikTok restricted this unaudited app to private-account, Only me posts. Public posting stays disabled until app review is approved.',
    access_token_invalid: 'The TikTok connection expired or was revoked. Reconnect the account.',
    scope_not_authorized: 'TikTok has not authorized the required publishing permission for this connection.',
    spam_risk_too_many_posts: 'TikTok rate-limited this posting attempt. Wait before trying again.',
  };
  return messages[String(code || '')] || 'TikTok could not complete this request. Try again or contact support with the visible error code.';
}

module.exports = {
  ALLOWED_ORIGINS,
  validateOrigin,
  validatePublishFields,
  allowedPrivacyOptions,
  providerError,
  sanitizeProviderReceipt,
  publicProviderMessage,
  parseBearer,
  utf16Length,
  canonicalPublishFingerprint,
  looksLikeMp4,
  isSafePublishId,
  pkceChallenge,
  validPkceVerifier,
};
