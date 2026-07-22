'use strict';

const crypto = require('node:crypto');
const Busboy = require('busboy');
const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret, defineBoolean } = require('firebase-functions/params');
const {
  validateOrigin,
  validatePublishFields,
  allowedPrivacyOptions,
  providerError,
  sanitizeProviderReceipt,
  publicProviderMessage,
  parseBearer,
  canonicalPublishFingerprint,
  looksLikeMp4,
  isSafePublishId,
  pkceChallenge,
  validPkceVerifier,
} = require('./validation');

const clientKey = defineSecret('SIGNALPOST_TIKTOK_CLIENT_KEY');
const clientSecret = defineSecret('SIGNALPOST_TIKTOK_CLIENT_SECRET');
const publicPostingEnabled = defineBoolean('SIGNALPOST_PUBLIC_POSTING_ENABLED', { default: false });
const SITE = 'https://michaelcostea.com';
const REDIRECT_URI = `${SITE}/tiktok/callback/`;
const TIKTOK_AUTH = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_TOKEN = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_CREATOR = 'https://open.tiktokapis.com/v2/post/publish/creator_info/query/?fields=creator_avatar_url,creator_username,creator_nickname,privacy_level_options,comment_disabled,duet_disabled,stitch_disabled,max_video_post_duration_sec';
const TIKTOK_INIT = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
const TIKTOK_STATUS = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/';
const MAX_VIDEO_BYTES = 9 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_VIDEO_BYTES + 128 * 1024;
const STATE_TTL_MS = 10 * 60 * 1000;
const EXCHANGE_TTL_MS = 2 * 60 * 1000;
const INTENT_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RECEIPT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const COLLECTION = 'signalpostV1';
const startMemoryWindow = new Map();

class HttpError extends Error {
  constructor(status, message, code = 'request_failed') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function appDb() {
  if (!getApps().length) initializeApp();
  return getFirestore();
}

function items(kind) {
  return appDb().collection(COLLECTION).doc(kind).collection('items');
}

function ref(kind, id) {
  return items(kind).doc(id);
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function randomToken(prefix) {
  return `${prefix}${crypto.randomBytes(32).toString('base64url')}`;
}

function setCors(req, res) {
  const origin = req.get('origin') || '';
  if (validateOrigin(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'no-referrer');
}

function requireAllowedOrigin(req) {
  if (!validateOrigin(req.get('origin') || '')) throw new HttpError(403, 'Origin is not allowed', 'origin_denied');
}

function clientAddress(req) {
  return String(req.ip || req.get('x-forwarded-for')?.split(',')[0] || 'unknown').trim().slice(0, 96);
}

async function enforceStartRate(req) {
  const now = Date.now();
  const ipKey = hash(clientAddress(req));
  const local = startMemoryWindow.get(ipKey) || [];
  const recent = local.filter(value => value > now - 60000);
  if (recent.length >= 5) throw new HttpError(429, 'Too many connection attempts. Wait before trying again.', 'oauth_start_rate_limited');
  recent.push(now);
  startMemoryWindow.set(ipKey, recent);
  const bucket = Math.floor(now / 3600000);
  const rateRef = ref('rateLimits', hash(`${ipKey}:${bucket}`));
  await appDb().runTransaction(async transaction => {
    const snap = await transaction.get(rateRef);
    const count = Number(snap.data()?.count || 0);
    if (count >= 20) throw new HttpError(429, 'Connection attempt limit reached. Try again later.', 'oauth_start_hourly_limit');
    transaction.set(rateRef, { count: count + 1, expiresAtMs: now + 2 * 3600000 }, { merge: true });
  });
}

async function requestJson(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
  const text = await response.text();
  let payload;
  try { payload = text ? JSON.parse(text) : {}; }
  catch { throw new HttpError(502, 'TikTok returned an invalid response', 'provider_invalid_response'); }
  const semantic = providerError(payload);
  if (!response.ok || semantic) {
    const code = semantic?.code || `http_${response.status}`;
    const error = new HttpError(response.status >= 400 && response.status < 500 ? response.status : 502, publicProviderMessage(code), code);
    error.providerReceipt = sanitizeProviderReceipt(payload);
    throw error;
  }
  return payload;
}

async function exchangeCode(code) {
  const form = new URLSearchParams({
    client_key: clientKey.value(), client_secret: clientSecret.value(), code,
    grant_type: 'authorization_code', redirect_uri: REDIRECT_URI,
  });
  return requestJson(TIKTOK_TOKEN, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
}

async function refreshAccessToken(tokenRecord) {
  const form = new URLSearchParams({
    client_key: clientKey.value(), client_secret: clientSecret.value(),
    grant_type: 'refresh_token', refresh_token: tokenRecord.refreshToken,
  });
  return requestJson(TIKTOK_TOKEN, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
}

function normalizedToken(providerToken, previous = {}) {
  const now = Date.now();
  return {
    accessToken: providerToken.access_token,
    refreshToken: providerToken.refresh_token || previous.refreshToken,
    openId: providerToken.open_id || previous.openId,
    scope: providerToken.scope || previous.scope || '',
    accessExpiresAtMs: now + Number(providerToken.expires_in || 0) * 1000,
    refreshExpiresAtMs: now + Number(providerToken.refresh_expires_in || 0) * 1000,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

async function deleteSessionsForAccount(accountKey) {
  for (;;) {
    const snapshot = await items('sessions').where('accountKey', '==', accountKey).limit(400).get();
    if (snapshot.empty) return;
    const batch = appDb().batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    if (snapshot.size < 400) return;
  }
}

async function requireSession(req) {
  const bearer = parseBearer(req.get('authorization'));
  if (!bearer) throw new HttpError(401, 'Connect TikTok first', 'session_missing');
  const sessionRef = ref('sessions', hash(bearer));
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) throw new HttpError(401, 'Session not found', 'session_invalid');
  const session = sessionSnap.data();
  if (Number(session.expiresAtMs || 0) <= Date.now()) {
    await sessionRef.delete();
    throw new HttpError(401, 'Session expired', 'session_expired');
  }
  const tokenRef = ref('accounts', session.accountKey);
  const tokenSnap = await tokenRef.get();
  if (!tokenSnap.exists) throw new HttpError(401, 'TikTok connection was removed', 'connection_missing');
  let token = tokenSnap.data();
  if (Number(token.refreshExpiresAtMs || 0) <= Date.now()) {
    await Promise.all([tokenRef.delete(), deleteSessionsForAccount(session.accountKey)]);
    throw new HttpError(401, 'TikTok connection expired. Reconnect the account.', 'connection_expired');
  }
  if (Number(token.accessExpiresAtMs || 0) <= Date.now() + 60000) {
    const refreshed = await refreshAccessToken(token);
    token = { ...token, ...normalizedToken(refreshed, token) };
    await tokenRef.set(token, { merge: true });
  }
  return { bearer, sessionRef, session, tokenRef, token };
}

async function creatorInfo(accessToken) {
  return requestJson(TIKTOK_CREATOR, {
    method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' }, body: '{}',
  });
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    if (!Buffer.isBuffer(req.rawBody) || req.rawBody.length > MAX_REQUEST_BYTES) {
      return reject(new HttpError(413, 'Request exceeds the SignalPost beta limit', 'request_too_large'));
    }
    let video = null;
    const fields = {};
    let fileRejected = false;
    const busboy = Busboy({ headers: req.headers, limits: { files: 1, fileSize: MAX_VIDEO_BYTES, fields: 24, parts: 26 } });
    busboy.on('field', (name, value) => { fields[name] = value; });
    busboy.on('file', (name, stream, info) => {
      const chunks = [];
      let bytes = 0;
      stream.on('limit', () => { fileRejected = true; });
      stream.on('data', chunk => { bytes += chunk.length; chunks.push(chunk); });
      stream.on('end', () => {
        if (name === 'video' && !fileRejected) video = { buffer: Buffer.concat(chunks), bytes, mime: info.mimeType };
      });
    });
    busboy.on('filesLimit', () => { fileRejected = true; });
    busboy.on('partsLimit', () => reject(new HttpError(400, 'Too many multipart fields', 'multipart_limit')));
    busboy.on('error', reject);
    busboy.on('finish', () => {
      if (fileRejected) return reject(new HttpError(413, 'Video exceeds the 9 MB beta limit', 'video_too_large'));
      resolve({ fields, video });
    });
    busboy.end(req.rawBody);
  });
}

async function revokeProvider(token) {
  try {
    const form = new URLSearchParams({ client_key: clientKey.value(), client_secret: clientSecret.value(), token: token.accessToken });
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/revoke/', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form, signal: AbortSignal.timeout(15000),
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};
    return response.ok && !providerError(payload);
  } catch {
    return false;
  }
}

async function deleteStoredConnection(auth) {
  await deleteSessionsForAccount(auth.session.accountKey);
  await auth.tokenRef.delete();
}

async function handleStart(req, res) {
  await enforceStartRate(req);
  const challenge = String(req.body?.pkce_challenge || '');
  if (!/^[A-Za-z0-9_-]{43}$/.test(challenge)) throw new HttpError(400, 'Valid PKCE challenge required', 'pkce_challenge_invalid');
  if (parseBearer(req.get('authorization'))) {
    const oldAuth = await requireSession(req);
    const providerRevokeConfirmed = await revokeProvider(oldAuth.token);
    await deleteStoredConnection(oldAuth);
    console.info('signalpost_reconnect_cleanup', { providerRevokeConfirmed });
  }
  const state = randomToken('sp_');
  await ref('oauthStates', hash(state)).set({
    pkceChallenge: challenge, expiresAtMs: Date.now() + STATE_TTL_MS, used: false, createdAt: FieldValue.serverTimestamp(),
  });
  const query = new URLSearchParams({
    client_key: clientKey.value(), scope: 'user.info.basic,video.publish', response_type: 'code', redirect_uri: REDIRECT_URI, state,
  });
  res.status(200).json({ authorization_url: `${TIKTOK_AUTH}?${query}` });
}

async function handleCallback(req, res) {
  const code = String(req.body?.code || '');
  const state = String(req.body?.state || '');
  if (!code || !state.startsWith('sp_')) throw new HttpError(400, 'Invalid OAuth callback', 'oauth_callback_invalid');
  const stateRef = ref('oauthStates', hash(state));
  let stateRecord;
  await appDb().runTransaction(async transaction => {
    const snap = await transaction.get(stateRef);
    stateRecord = snap.data();
    if (!snap.exists || stateRecord.used || Number(stateRecord.expiresAtMs || 0) <= Date.now()) {
      throw new HttpError(400, 'OAuth state expired or already used', 'oauth_state_invalid');
    }
    transaction.set(stateRef, { used: true, usedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
  const providerToken = await exchangeCode(code);
  if (!providerToken.access_token || !providerToken.refresh_token || !providerToken.open_id) {
    throw new HttpError(502, 'TikTok connection response was incomplete', 'oauth_token_incomplete');
  }
  const accountKey = hash(providerToken.open_id);
  await ref('accounts', accountKey).set(normalizedToken(providerToken), { merge: true });
  const exchangeCode = randomToken('spe_');
  await ref('sessionExchanges', hash(exchangeCode)).set({
    accountKey, pkceChallenge: stateRecord.pkceChallenge, used: false,
    expiresAtMs: Date.now() + EXCHANGE_TTL_MS, createdAt: FieldValue.serverTimestamp(),
  });
  res.status(200).json({ exchange_code: exchangeCode });
}

async function handleSessionExchange(req, res) {
  const exchangeCode = String(req.body?.exchange_code || '');
  const verifier = String(req.body?.pkce_verifier || '');
  if (!exchangeCode.startsWith('spe_') || !validPkceVerifier(verifier)) {
    throw new HttpError(400, 'Invalid session exchange', 'session_exchange_invalid');
  }
  const exchangeRef = ref('sessionExchanges', hash(exchangeCode));
  const session = randomToken('sps_');
  const sessionRef = ref('sessions', hash(session));
  await appDb().runTransaction(async transaction => {
    const snap = await transaction.get(exchangeRef);
    const record = snap.data();
    if (!snap.exists || record.used || Number(record.expiresAtMs || 0) <= Date.now()) {
      throw new HttpError(400, 'Session exchange expired or already used', 'session_exchange_used');
    }
    if (pkceChallenge(verifier) !== record.pkceChallenge) {
      throw new HttpError(403, 'Session exchange did not match this browser', 'pkce_verification_failed');
    }
    transaction.set(exchangeRef, { used: true, usedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.set(sessionRef, { accountKey: record.accountKey, expiresAtMs: Date.now() + SESSION_TTL_MS, createdAt: FieldValue.serverTimestamp() });
  });
  res.status(200).json({ session });
}

async function handleMe(req, res) {
  const { token } = await requireSession(req);
  const payload = await creatorInfo(token.accessToken);
  const creator = payload.data || {};
  creator.privacy_level_options = allowedPrivacyOptions(creator.privacy_level_options, publicPostingEnabled.value());
  res.status(200).json({
    creator,
    capabilities: { public_posting_enabled: publicPostingEnabled.value(), allowed_privacy_options: creator.privacy_level_options },
    provider: sanitizeProviderReceipt({ error: payload.error || {} }).error || {},
  });
}

async function handlePublishIntent(req, res) {
  const auth = await requireSession(req);
  const fields = req.body?.fields || {};
  const mediaSha256 = String(req.body?.media_sha256 || '').toLowerCase();
  const mediaBytes = Number(req.body?.media_bytes || 0);
  if (!/^[a-f0-9]{64}$/.test(mediaSha256) || !Number.isInteger(mediaBytes) || mediaBytes < 12 || mediaBytes > MAX_VIDEO_BYTES) {
    throw new HttpError(400, 'Valid media fingerprint and size required', 'media_fingerprint_invalid');
  }
  const creatorPayload = await creatorInfo(auth.token.accessToken);
  const privacy = allowedPrivacyOptions(creatorPayload.data?.privacy_level_options, publicPostingEnabled.value());
  validatePublishFields(fields, privacy);
  const intentToken = randomToken('spi_');
  await ref('publishIntents', hash(intentToken)).set({
    accountKey: auth.session.accountKey,
    payloadHash: canonicalPublishFingerprint(fields, mediaSha256, mediaBytes),
    used: false, expiresAtMs: Date.now() + INTENT_TTL_MS, createdAt: FieldValue.serverTimestamp(),
  });
  res.status(200).json({ intent_token: intentToken, expires_in_seconds: Math.floor(INTENT_TTL_MS / 1000) });
}

async function handlePublish(req, res) {
  const auth = await requireSession(req);
  const contentLength = Number(req.get('content-length') || 0);
  if (contentLength && contentLength > MAX_REQUEST_BYTES) throw new HttpError(413, 'Request exceeds the SignalPost beta limit', 'request_too_large');
  if (!String(req.get('content-type') || '').startsWith('multipart/form-data')) {
    throw new HttpError(415, 'Multipart form data required', 'content_type_invalid');
  }
  const { fields, video } = await parseMultipart(req);
  if (!video || !video.bytes) throw new HttpError(400, 'Choose an MP4 video', 'video_missing');
  if (video.mime !== 'video/mp4' || !looksLikeMp4(video.buffer)) {
    throw new HttpError(415, 'The selected file is not a valid MP4 container', 'video_type_invalid');
  }
  const mediaSha256 = crypto.createHash('sha256').update(video.buffer).digest('hex');
  const intentToken = String(fields.intent_token || '');
  if (!intentToken.startsWith('spi_')) throw new HttpError(400, 'Fresh publish confirmation required', 'publish_intent_missing');

  const creatorPayload = await creatorInfo(auth.token.accessToken);
  const creator = creatorPayload.data || {};
  const privacy = allowedPrivacyOptions(creator.privacy_level_options, publicPostingEnabled.value());
  const postInfo = validatePublishFields(fields, privacy);
  if (creator.comment_disabled) postInfo.allow_comment = false;
  if (creator.duet_disabled) postInfo.allow_duet = false;
  if (creator.stitch_disabled) postInfo.allow_stitch = false;

  const expectedHash = canonicalPublishFingerprint(fields, mediaSha256, video.bytes);
  const intentRef = ref('publishIntents', hash(intentToken));
  const jobId = crypto.randomUUID();
  const now = Date.now();
  await appDb().runTransaction(async transaction => {
    const [intentSnap, tokenSnap] = await Promise.all([transaction.get(intentRef), transaction.get(auth.tokenRef)]);
    const intent = intentSnap.data();
    if (!intentSnap.exists || intent.used) throw new HttpError(409, 'This publish confirmation was already used', 'intent_already_used');
    if (Number(intent.expiresAtMs || 0) <= now) throw new HttpError(409, 'Publish confirmation expired. Review and confirm again.', 'intent_expired');
    if (intent.accountKey !== auth.session.accountKey || intent.payloadHash !== expectedHash) {
      throw new HttpError(403, 'Media or settings changed after confirmation', 'intent_payload_mismatch');
    }
    const lastPublishAtMs = Number(tokenSnap.data()?.lastPublishAtMs || 0);
    if (lastPublishAtMs > now - 60000) throw new HttpError(429, 'Wait one minute before another publish attempt', 'publish_rate_limited');
    transaction.set(intentRef, { used: true, usedAt: FieldValue.serverTimestamp(), jobId }, { merge: true });
    transaction.set(auth.tokenRef, { lastPublishAtMs: now }, { merge: true });
  });

  const jobRef = ref('publishJobs', jobId);
  await jobRef.set({
    accountKey: auth.session.accountKey, status: 'initializing', mediaSha256, mediaBytes: video.bytes,
    mediaType: video.mime, privacyLevel: postInfo.privacy_level, expiresAtMs: now + RECEIPT_TTL_MS,
    createdAt: FieldValue.serverTimestamp(),
  });

  let initPayload;
  try {
    initPayload = await requestJson(TIKTOK_INIT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token.accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        post_info: postInfo,
        source_info: { source: 'FILE_UPLOAD', video_size: video.bytes, chunk_size: video.bytes, total_chunk_count: 1 },
      }),
    });
  } catch (error) {
    await jobRef.set({ status: 'provider_blocked', providerCode: error.code || 'init_failed', providerReceipt: error.providerReceipt || {}, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    throw error;
  }

  const publishId = String(initPayload.data?.publish_id || '');
  const uploadUrl = initPayload.data?.upload_url;
  if (!isSafePublishId(publishId) || !uploadUrl) throw new HttpError(502, 'TikTok initialization did not return a valid upload target', 'provider_init_incomplete');
  await ref('publishIds', hash(publishId)).set({ accountKey: auth.session.accountKey, jobId, publishId, expiresAtMs: now + RECEIPT_TTL_MS });

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(video.bytes), 'Content-Range': `bytes 0-${video.bytes - 1}/${video.bytes}` },
    body: video.buffer, signal: AbortSignal.timeout(90000),
  });
  if (!uploadResponse.ok) {
    await jobRef.set({ status: 'upload_failed', publishId, uploadHttpStatus: uploadResponse.status, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    throw new HttpError(502, `TikTok media upload failed with HTTP ${uploadResponse.status}`, 'provider_upload_failed');
  }
  await jobRef.set({ status: 'processing', publishId, providerReceipt: sanitizeProviderReceipt(initPayload), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  res.status(202).json({ publish_id: publishId, status: 'processing' });
}

async function handlePublishStatus(req, res) {
  const auth = await requireSession(req);
  const publishId = String(req.body?.publish_id || '').trim();
  if (!isSafePublishId(publishId)) throw new HttpError(400, 'Valid publish ID required', 'publish_id_invalid');
  const binding = await ref('publishIds', hash(publishId)).get();
  if (!binding.exists || binding.data().accountKey !== auth.session.accountKey || binding.data().publishId !== publishId) {
    throw new HttpError(404, 'Publish ID was not issued to this connected account', 'publish_id_not_found');
  }
  const payload = await requestJson(TIKTOK_STATUS, {
    method: 'POST', headers: { Authorization: `Bearer ${auth.token.accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ publish_id: publishId }),
  });
  await ref('publishJobs', binding.data().jobId).set({ status: payload.data?.status || 'processing', providerStatusReceipt: sanitizeProviderReceipt(payload), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  res.status(200).json(sanitizeProviderReceipt(payload));
}

async function handleDisconnect(req, res) {
  const auth = await requireSession(req);
  const providerRevokeConfirmed = await revokeProvider(auth.token);
  await deleteStoredConnection(auth);
  res.status(200).json({ provider_revoke_confirmed: providerRevokeConfirmed, stored_credentials_deleted: true });
}

async function deleteExpiredKind(kind, field, now = Date.now()) {
  let deleted = 0;
  for (;;) {
    const snapshot = await items(kind).where(field, '<=', now).limit(400).get();
    if (snapshot.empty) return deleted;
    const batch = appDb().batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;
    if (snapshot.size < 400) return deleted;
  }
}

async function cleanupExpired() {
  const now = Date.now();
  const specs = [
    ['oauthStates', 'expiresAtMs'], ['sessionExchanges', 'expiresAtMs'], ['publishIntents', 'expiresAtMs'],
    ['sessions', 'expiresAtMs'], ['publishJobs', 'expiresAtMs'], ['publishIds', 'expiresAtMs'],
    ['rateLimits', 'expiresAtMs'], ['accounts', 'refreshExpiresAtMs'],
  ];
  const results = {};
  for (const [kind, field] of specs) results[kind] = await deleteExpiredKind(kind, field, now);
  return results;
}

async function router(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    if (!validateOrigin(req.get('origin') || '')) return res.status(403).end();
    return res.status(204).end();
  }
  const route = String(req.path || '/').replace(/^\/+|\/+$/g, '');
  if (route === 'health' && req.method === 'GET') {
    return res.status(200).json({ service: 'SignalPost', status: 'ready', public_posting_enabled: publicPostingEnabled.value() });
  }
  requireAllowedOrigin(req);
  if (route === 'start' && req.method === 'POST') return handleStart(req, res);
  if (route === 'callback' && req.method === 'POST') return handleCallback(req, res);
  if (route === 'session-exchange' && req.method === 'POST') return handleSessionExchange(req, res);
  if (route === 'me' && req.method === 'GET') return handleMe(req, res);
  if (route === 'publish-intent' && req.method === 'POST') return handlePublishIntent(req, res);
  if (route === 'publish' && req.method === 'POST') return handlePublish(req, res);
  if (route === 'publish-status' && req.method === 'POST') return handlePublishStatus(req, res);
  if (route === 'disconnect' && req.method === 'POST') return handleDisconnect(req, res);
  throw new HttpError(404, 'Route not found', 'not_found');
}

exports.signalPostApi = onRequest({
  region: 'us-central1', invoker: 'public', timeoutSeconds: 120, memory: '512MiB', maxInstances: 4, concurrency: 10,
  secrets: [clientKey, clientSecret],
}, async (req, res) => {
  try {
    await router(req, res);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const code = error instanceof HttpError ? error.code : 'internal_error';
    const message = error instanceof HttpError ? error.message : 'SignalPost could not complete the request';
    if (status >= 500) console.error('signalpost_request_failed', { code, status });
    else console.warn('signalpost_request_rejected', { code, status });
    if (!res.headersSent) res.status(status).json({ error: code, message });
  }
});

exports.signalPostCleanup = onSchedule({ schedule: 'every day 03:15', timeZone: 'Australia/Melbourne', region: 'us-central1', timeoutSeconds: 120 }, async () => {
  const results = await cleanupExpired();
  console.info('signalpost_retention_cleanup', results);
});
