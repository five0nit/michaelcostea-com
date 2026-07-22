(() => {
  'use strict';

  const API_BASE = 'https://us-central1-idontknowhowtoai.cloudfunctions.net/signalPostApi';
  const SESSION_KEY = 'signalpost_session';
  const PKCE_KEY = 'signalpost_pkce_verifier';
  const MAX_FILE_BYTES = 9 * 1024 * 1024;
  const elements = Object.fromEntries([
    'connectTikTok', 'connectionPill', 'globalNotice', 'publisherFields', 'postForm', 'disconnectButton',
    'creatorAvatar', 'creatorNickname', 'creatorUsername', 'videoFile', 'fileSummary', 'videoPreview',
    'postTitle', 'titleCount', 'privacyLevel', 'allowComment', 'allowDuet', 'allowStitch', 'commentHint',
    'duetHint', 'stitchHint', 'commercialDisclosure', 'commercialDetails', 'brandOrganic', 'brandContent',
    'commercialNotice', 'musicAgreement', 'musicAgreementText', 'publishConsent', 'publishButton',
    'receiptTitle', 'receiptMessage', 'receiptCreator', 'receiptPrivacy', 'receiptStatus', 'receiptPublishId',
  ].map(id => [id, document.getElementById(id)]));

  let session = sessionStorage.getItem(SESSION_KEY) || '';
  let creator = null;
  let capabilities = { public_posting_enabled: false, allowed_privacy_options: [] };
  let previewUrl = '';
  let maxDurationSeconds = 0;
  let selectedDurationSeconds = 0;
  let publishing = false;

  function setNotice(message, kind = '') {
    elements.globalNotice.textContent = message;
    elements.globalNotice.className = `notice${kind ? ` ${kind}` : ''}`;
  }

  function providerMessage(error, fallback) {
    if (error?.error === 'unaudited_client_can_only_post_to_private_accounts') {
      return 'TikTok restricted this unaudited app to private-account, Only me posts. No video was uploaded. Public posting stays disabled until app review is approved.';
    }
    return error?.message || fallback;
  }

  async function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (session) headers.set('Authorization', `Bearer ${session}`);
    const response = await fetch(`${API_BASE}/${path}`, { ...options, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(providerMessage(payload, `Request failed with HTTP ${response.status}`));
      error.code = payload.error || 'request_failed';
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function base64Url(bytes) {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function newPkceVerifier() {
    return base64Url(crypto.getRandomValues(new Uint8Array(48)));
  }

  async function sha256Base64Url(value) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return base64Url(new Uint8Array(digest));
  }

  async function fileSha256(file) {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  async function takeCallbackFragment() {
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const exchangeCode = fragment.get('exchange_code') || '';
    const returnedError = fragment.get('error') || '';
    if (!exchangeCode && !returnedError) return;
    history.replaceState(null, '', `${location.pathname}${location.search}`);
    if (returnedError) {
      sessionStorage.removeItem(PKCE_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      session = '';
      setNotice(`TikTok connection failed: ${returnedError}`, 'error');
      return;
    }
    const verifier = sessionStorage.getItem(PKCE_KEY) || '';
    if (!exchangeCode.startsWith('spe_') || !verifier) {
      setNotice('The one-time connection response does not belong to this browser tab. Start connection again.', 'error');
      return;
    }
    try {
      const payload = await api('session-exchange', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchange_code: exchangeCode, pkce_verifier: verifier }),
      });
      if (!String(payload.session || '').startsWith('sps_')) throw new Error('SignalPost returned an invalid session');
      session = payload.session;
      sessionStorage.setItem(SESSION_KEY, session);
    } catch (error) {
      sessionStorage.removeItem(SESSION_KEY);
      session = '';
      setNotice(error.message, 'error');
    } finally {
      sessionStorage.removeItem(PKCE_KEY);
    }
  }

  function setConnected(connected) {
    elements.connectionPill.dataset.state = connected ? 'connected' : 'disconnected';
    elements.connectionPill.querySelector('b').textContent = connected ? 'TikTok connected' : 'Not connected';
    elements.publisherFields.disabled = !connected;
    elements.connectTikTok.textContent = connected ? 'Replace TikTok account' : 'Connect TikTok';
    updatePublishState();
  }

  function clearCreator() {
    creator = null;
    capabilities = { public_posting_enabled: false, allowed_privacy_options: [] };
    elements.creatorNickname.textContent = 'No creator loaded';
    elements.creatorUsername.textContent = 'Connect TikTok above';
    elements.creatorAvatar.textContent = 'SP';
    elements.privacyLevel.replaceChildren(new Option('Choose privacy', ''));
    maxDurationSeconds = 0;
    setConnected(false);
  }

  function renderCreator(data, providerCapabilities) {
    creator = data;
    capabilities = providerCapabilities || capabilities;
    const nickname = data.creator_nickname || 'Connected creator';
    const username = data.creator_username ? `@${String(data.creator_username).replace(/^@/, '')}` : 'Username unavailable';
    elements.creatorNickname.textContent = nickname;
    elements.creatorUsername.textContent = username;
    elements.receiptCreator.textContent = username;
    elements.creatorAvatar.textContent = '';
    if (data.creator_avatar_url) {
      const image = new Image();
      image.alt = '';
      image.referrerPolicy = 'no-referrer';
      image.src = data.creator_avatar_url;
      elements.creatorAvatar.append(image);
    } else {
      elements.creatorAvatar.textContent = nickname.slice(0, 2).toUpperCase();
    }

    elements.privacyLevel.replaceChildren(new Option('Choose privacy', ''));
    for (const value of data.privacy_level_options || []) {
      const labels = {
        PUBLIC_TO_EVERYONE: 'Everyone', MUTUAL_FOLLOW_FRIENDS: 'Friends — followers you follow back',
        FOLLOWER_OF_CREATOR: 'Followers', SELF_ONLY: 'Only me',
      };
      elements.privacyLevel.append(new Option(labels[value] || value, value));
    }
    for (const [control, disabled, hint] of [
      [elements.allowComment, data.comment_disabled, elements.commentHint],
      [elements.allowDuet, data.duet_disabled, elements.duetHint],
      [elements.allowStitch, data.stitch_disabled, elements.stitchHint],
    ]) {
      control.checked = false;
      control.disabled = Boolean(disabled);
      hint.textContent = disabled ? 'Disabled by the connected creator account' : 'Available for this creator account';
    }
    maxDurationSeconds = Number(data.max_video_post_duration_sec || 0);
    setConnected(true);
    const gate = capabilities.public_posting_enabled
      ? 'Provider public-post gate is enabled for this reviewed deployment.'
      : 'App-review mode: the server blocks public/friends posting. Only me may be available for private test accounts.';
    setNotice(`Connected as ${nickname} (${username}). ${gate}`, capabilities.public_posting_enabled ? 'success' : '');
  }

  async function loadCreator() {
    if (!session) return clearCreator();
    try {
      const payload = await api('me', { method: 'GET' });
      renderCreator(payload.creator || {}, payload.capabilities || {});
    } catch (error) {
      if (error.status === 401) {
        sessionStorage.removeItem(SESSION_KEY);
        session = '';
        clearCreator();
      }
      setNotice(error.message, 'error');
    }
  }

  async function connect() {
    elements.connectTikTok.disabled = true;
    try {
      const verifier = newPkceVerifier();
      const challenge = await sha256Base64Url(verifier);
      sessionStorage.setItem(PKCE_KEY, verifier);
      const payload = await api('start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pkce_challenge: challenge }),
      });
      if (!payload.authorization_url?.startsWith('https://www.tiktok.com/')) throw new Error('TikTok authorization URL was invalid');
      window.location.assign(payload.authorization_url);
    } catch (error) {
      sessionStorage.removeItem(PKCE_KEY);
      setNotice(error.message, 'error');
      elements.connectTikTok.disabled = false;
    }
  }

  function fileSummary(file) {
    if (!file) return 'No file selected';
    return `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  }

  function handleFile() {
    const file = elements.videoFile.files?.[0];
    selectedDurationSeconds = 0;
    elements.fileSummary.textContent = fileSummary(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = '';
    elements.videoPreview.hidden = true;
    elements.videoPreview.removeAttribute('src');
    if (!file) return updatePublishState();
    if (file.type !== 'video/mp4' && !file.name.toLowerCase().endsWith('.mp4')) {
      setNotice('Choose an MP4 video.', 'error');
      elements.videoFile.value = '';
      return updatePublishState();
    }
    if (file.size > MAX_FILE_BYTES) {
      setNotice('This review preview accepts MP4 videos up to 9 MB.', 'error');
      elements.videoFile.value = '';
      return updatePublishState();
    }
    previewUrl = URL.createObjectURL(file);
    elements.videoPreview.src = previewUrl;
    elements.videoPreview.hidden = false;
    elements.videoPreview.onloadedmetadata = () => {
      selectedDurationSeconds = elements.videoPreview.duration || 0;
      if (maxDurationSeconds && selectedDurationSeconds > maxDurationSeconds) {
        setNotice(`This account allows videos up to ${maxDurationSeconds} seconds. The selected video is ${Math.ceil(selectedDurationSeconds)} seconds.`, 'error');
      }
      updatePublishState();
    };
    setNotice('Video selected. Watch the preview and complete the remaining controls.');
    updatePublishState();
  }

  function renderAgreementText() {
    const musicLink = document.createElement('a');
    musicLink.href = 'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en';
    musicLink.target = '_blank';
    musicLink.rel = 'noopener noreferrer';
    musicLink.textContent = 'Music Usage Confirmation';
    elements.musicAgreementText.replaceChildren(document.createTextNode('By posting, you agree to TikTok\'s '));
    if (elements.brandContent.checked) {
      const brandLink = document.createElement('a');
      brandLink.href = 'https://www.tiktok.com/legal/page/global/bc-policy/en';
      brandLink.target = '_blank';
      brandLink.rel = 'noopener noreferrer';
      brandLink.textContent = 'Branded Content Policy';
      elements.musicAgreementText.append(brandLink, document.createTextNode(' and '), musicLink, document.createTextNode('.'));
    } else {
      elements.musicAgreementText.append(musicLink, document.createTextNode('.'));
    }
  }

  function updateCommercialState() {
    const enabled = elements.commercialDisclosure.checked;
    elements.commercialDetails.hidden = !enabled;
    if (!enabled) {
      elements.brandOrganic.checked = false;
      elements.brandContent.checked = false;
    }
    const privateVisibility = elements.privacyLevel.value === 'SELF_ONLY';
    if (privateVisibility && elements.brandContent.checked) elements.brandContent.checked = false;
    elements.brandContent.disabled = privateVisibility;
    if (!enabled) elements.commercialNotice.textContent = 'Commercial disclosure is off.';
    else if (privateVisibility) elements.commercialNotice.textContent = 'Branded content visibility cannot be set to private. Choose Your brand only, or select an available public/friends privacy after app approval.';
    else if (!elements.brandOrganic.checked && !elements.brandContent.checked) elements.commercialNotice.textContent = 'You need to indicate if your content promotes yourself, a third party, or both.';
    else if (elements.brandContent.checked) elements.commercialNotice.textContent = 'Your photo/video will be labeled as “Paid partnership”.';
    else elements.commercialNotice.textContent = 'Your photo/video will be labeled as “Promotional content”.';
    renderAgreementText();
    updatePublishState();
  }

  function publishFields() {
    return {
      title: elements.postTitle.value.trim(), privacy_level: elements.privacyLevel.value,
      allow_comment: String(elements.allowComment.checked), allow_duet: String(elements.allowDuet.checked),
      allow_stitch: String(elements.allowStitch.checked), commercial_disclosure: String(elements.commercialDisclosure.checked),
      brand_organic: String(elements.brandOrganic.checked), brand_content: String(elements.brandContent.checked),
      music_agreement: String(elements.musicAgreement.checked), publish_consent: String(elements.publishConsent.checked),
    };
  }

  function updatePublishState() {
    const file = elements.videoFile.files?.[0];
    const durationAllowed = !maxDurationSeconds || !selectedDurationSeconds || selectedDurationSeconds <= maxDurationSeconds;
    const commercialAllowed = !elements.commercialDisclosure.checked || elements.brandOrganic.checked || elements.brandContent.checked;
    const brandPrivacyAllowed = !elements.brandContent.checked || elements.privacyLevel.value !== 'SELF_ONLY';
    const valid = Boolean(
      session && creator && file && file.size <= MAX_FILE_BYTES && durationAllowed && commercialAllowed && brandPrivacyAllowed &&
      elements.postTitle.value.trim() && elements.privacyLevel.value && elements.musicAgreement.checked &&
      elements.publishConsent.checked && !publishing
    );
    elements.publishButton.disabled = !valid;
    elements.titleCount.textContent = `${elements.postTitle.value.length} / 2200`;
    elements.receiptPrivacy.textContent = elements.privacyLevel.options[elements.privacyLevel.selectedIndex]?.text || '—';
  }

  function updateReceipt(title, message, status, publishId = '—') {
    elements.receiptTitle.textContent = title;
    elements.receiptMessage.textContent = message;
    elements.receiptStatus.textContent = status;
    elements.receiptPublishId.textContent = publishId;
  }

  async function pollStatus(publishId) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      try {
        const payload = await api('publish-status', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publish_id: publishId }),
        });
        const status = payload.data?.status || 'PROCESSING';
        updateReceipt(status === 'PUBLISH_COMPLETE' ? 'Provider complete' : 'Provider processing', `TikTok status: ${status}`, status, publishId);
        if (status === 'PUBLISH_COMPLETE' || status === 'FAILED') return;
      } catch (error) {
        updateReceipt('Status check paused', error.message, 'CHECK_FAILED', publishId);
        return;
      }
    }
    updateReceipt('Still processing', 'TikTok has not returned a terminal result yet. Keep this publish ID for support.', 'PROCESSING', publishId);
  }

  async function publish(event) {
    event.preventDefault();
    updatePublishState();
    if (elements.publishButton.disabled) return;
    publishing = true;
    updatePublishState();
    updateReceipt('Confirming exact post', 'Binding this media and these settings to a one-time confirmation.', 'CONFIRMING');
    setNotice('Creating a one-time confirmation for this exact reviewed post…');
    const file = elements.videoFile.files[0];
    const fields = publishFields();
    try {
      const mediaSha256 = await fileSha256(file);
      const intent = await api('publish-intent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields, media_sha256: mediaSha256, media_bytes: file.size }),
      });
      if (!String(intent.intent_token || '').startsWith('spi_')) throw new Error('SignalPost did not return a valid one-time confirmation');
      const data = new FormData();
      data.set('video', file);
      for (const [key, value] of Object.entries(fields)) data.set(key, value);
      data.set('intent_token', intent.intent_token);
      updateReceipt('Submitting', 'Initializing the provider upload. No success claim yet.', 'INITIALIZING');
      const payload = await api('publish', { method: 'POST', body: data });
      const publishId = String(payload.publish_id || '');
      updateReceipt('Upload accepted', 'TikTok accepted the media for processing. Public visibility is not yet proven.', payload.status || 'PROCESSING', publishId || '—');
      setNotice('TikTok accepted the upload for processing. It may take a few minutes to appear on the profile.', 'success');
      if (publishId) void pollStatus(publishId);
    } catch (error) {
      updateReceipt('Not published', error.message, error.code || 'FAILED');
      setNotice(error.message, 'error');
    } finally {
      elements.musicAgreement.checked = false;
      elements.publishConsent.checked = false;
      publishing = false;
      updatePublishState();
    }
  }

  async function disconnect() {
    if (!session) return;
    elements.disconnectButton.disabled = true;
    try {
      const result = await api('disconnect', { method: 'POST' });
      sessionStorage.removeItem(SESSION_KEY);
      session = '';
      clearCreator();
      if (result.provider_revoke_confirmed) {
        updateReceipt('Connection removed', 'TikTok revocation was confirmed and stored credentials were deleted.', 'DISCONNECTED');
        setNotice('TikTok disconnected. Provider revocation confirmed; stored credentials deleted.', 'success');
      } else {
        updateReceipt('Local connection removed', 'Stored credentials were deleted, but TikTok did not confirm provider revocation.', 'REVOCATION_UNCONFIRMED');
        setNotice('Stored credentials deleted. TikTok did not confirm revocation; remove SignalPost in TikTok connected-app settings.', 'error');
      }
    } catch (error) {
      setNotice(error.message, 'error');
    } finally {
      elements.disconnectButton.disabled = false;
    }
  }

  elements.connectTikTok.addEventListener('click', connect);
  elements.videoFile.addEventListener('change', handleFile);
  elements.postTitle.addEventListener('input', updatePublishState);
  elements.privacyLevel.addEventListener('change', updateCommercialState);
  elements.commercialDisclosure.addEventListener('change', updateCommercialState);
  elements.brandOrganic.addEventListener('change', updateCommercialState);
  elements.brandContent.addEventListener('change', updateCommercialState);
  elements.musicAgreement.addEventListener('change', updatePublishState);
  elements.publishConsent.addEventListener('change', updatePublishState);
  elements.postForm.addEventListener('submit', publish);
  elements.disconnectButton.addEventListener('click', disconnect);
  window.addEventListener('beforeunload', () => { if (previewUrl) URL.revokeObjectURL(previewUrl); });

  void (async () => {
    await takeCallbackFragment();
    await loadCreator();
    renderAgreementText();
    updateCommercialState();
    updatePublishState();
  })();
})();
