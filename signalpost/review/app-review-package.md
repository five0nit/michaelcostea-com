# SignalPost — TikTok app review package

**Prepared:** 22 July 2026
**Product status:** Public product; Direct Post public visibility is server-locked pending TikTok approval.

## Product identity

- **App name:** SignalPost
- **Operator:** Michael Costea
- **Website:** https://michaelcostea.com/signalpost/
- **Privacy Policy:** https://michaelcostea.com/signalpost/privacy/
- **Terms of Service:** https://michaelcostea.com/signalpost/terms/
- **Support and data deletion:** https://michaelcostea.com/signalpost/support/
- **OAuth redirect URI:** https://michaelcostea.com/tiktok/callback/
- **Support contact:** costea.michael@gmail.com
- **Icon:** `/assets/signalpost/signalpost-icon-1024.png` (1024×1024 PNG)

## App description

SignalPost helps independent creators review and publish original MP4 videos to their own TikTok profiles. Users connect TikTok, confirm the creator identity, preview their selected video, edit the caption, manually choose privacy and interactions, declare commercial content, accept the required music or branded-content terms, and explicitly approve each upload. SignalPost does not scrape third-party content, add watermarks, schedule unattended posts, or upload before per-post consent.

## Intended audience and public use

SignalPost is available to independent creators who need a clear, review-led posting flow. It is not an internal uploader for the operator's account or a team-only utility. Any eligible creator can visit the public product, connect an account through TikTok OAuth, and use the same controls.

## Requested product

- **Content Posting API → Direct Post**
- **Scope:** `video.publish`
- **Supporting scope:** `user.info.basic`

### `video.publish` justification

SignalPost requires `video.publish` to submit one original MP4 selected and previewed by the connected creator after that creator has manually chosen the provider-returned privacy and interaction settings, completed commercial-content declarations, accepted the required TikTok policy confirmation, and pressed the final publish button. The server binds consent to the exact media hash and settings with a single-use intent before initializing a TikTok upload.

### `user.info.basic` justification

SignalPost uses basic creator information to show the connected creator's nickname, username, and avatar before every post. This prevents posting to an unexpected account and lets the user verify account identity before selecting media.

## Complete user flow

1. User opens the public SignalPost website.
2. User presses **Connect TikTok**.
3. SignalPost creates a browser-bound PKCE challenge and redirects to TikTok OAuth.
4. TikTok returns a one-time authorization response; SignalPost exchanges it only in the browser tab that initiated connection.
5. SignalPost displays the connected creator identity and account-specific posting capabilities.
6. User selects one original MP4 from their device and watches the local preview.
7. User edits the title/caption.
8. User manually chooses privacy; SignalPost does not set a default.
9. User manually chooses available Comment, Duet, and Stitch settings; all begin off and provider-disabled controls remain disabled.
10. User sets Commercial Content Disclosure. If enabled, at least **Your brand** or **Branded content** is required. Branded content cannot use private visibility.
11. User agrees to TikTok's Music Usage Confirmation and, where applicable, Branded Content Policy.
12. User explicitly confirms the exact account, media, text, privacy, interactions, and disclosures.
13. SignalPost creates a short-lived, single-use intent bound to the exact media SHA-256 and settings.
14. Only then does the server initialize and upload to TikTok.
15. SignalPost shows the provider processing state and publish ID. It never presents upload initialization as proof of public visibility.
16. Required consent controls reset after every attempt.
17. User can disconnect; SignalPost deletes stored credentials/sessions and truthfully reports whether TikTok confirmed provider revocation.

## Safety and compliance controls

- Public/friends posting is blocked by a default-off server setting until TikTok approval is verified.
- Unreviewed deployment exposes only `SELF_ONLY` when the provider returns it.
- OAuth state is one-use and browser-bound with PKCE.
- Reusable bearer sessions are never returned in URLs.
- Provider credentials remain server-side.
- Every publish requires a single-use intent bound to the exact media hash, size, and controls.
- Publish throttling and intent consumption are transactional.
- Provider semantic errors are checked even when HTTP succeeds.
- Provider receipts are recursively redacted.
- Uploads are limited to 9 MB MP4 and require an MP4 `ftyp` signature.
- Publish IDs are opaque, bounded, and account-bound before status polling.
- Scheduled retention cleanup removes expired states, exchanges, intents, sessions, credentials, and 30-day receipts.
- No unattended schedule exists in SignalPost.

## Current truthful limitation

TikTok currently identifies the developer client as unaudited and blocks public Direct Post. SignalPost therefore keeps its server public-post gate false. This is the condition for which this app review package requests approval; it is not represented as an approved capability.

## Reviewer verification

Use the end-to-end procedure in `demo-script.md`. Record the public website, policies, OAuth permission screen, connected creator identity, media preview, editable caption, privacy selector, interaction controls, commercial disclosure states, policy confirmation, final consent, provider processing receipt, and disconnect/data deletion flow.
