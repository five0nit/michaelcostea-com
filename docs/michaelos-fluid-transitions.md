# MichaelOS fluid transitions

## Scope and base

Improve the existing retro desktop's transitions without changing content, routes, sound defaults, framework or dependencies. Inspired by the desktop/Start/app metaphor in https://talkingsasquach.com/ (SquachWare); text extraction succeeded, but Cloudflare blocked interactive visual inspection. Exact reference timing and animation styles were not verified or copied.

Disposition: **selective-reuse**, canonical `five0nit/michaelcostea-com` at `3e8a82f09b1903dbc04d6b352955dd48b460cd5d`. Existing route/focus/geometry/reduced-motion hooks retained. Automated Brief2Ship discovery was inconclusive due to missing license/generic static-inspection evidence; manual in-place inspection selected the user's own repository, not third-party code. No new runtime dependency. Discovery and manual decision receipts: `/tmp/brief2ship-preflight-michaelos-motion-20261015/{discovery.json,discovery.md,selection.md}`.

## Motion contract

- Real window surfaces animate using native Web Animations API `translate`, `scale` and `opacity`, not a separate wireframe or layout-property tween.
- Desktop open/restore: 280ms; mobile open: 220ms, simple vertical entrance.
- Minimise: 260ms, shrinking into its actual taskbar button when visible.
- Close: 180ms; maximise/restore geometry: 300ms FLIP-style interpolation.
- Shared easing: `cubic-bezier(.16,1,.3,1)`; Start menu: 180ms lift/reveal; project archive: smooth existing reveal.
- Semantic state, routes and accessibility change immediately. Exiting windows remain visually painted at their captured geometry but are inert, aria-hidden and pointer-transparent.
- One managed animation per window. Completion handlers are identity-guarded, and manual layout, viewport changes and motion preference changes cancel safely.
- Reduced motion and the existing manual animation toggle skip/settle transitions. No added audio or forced boot animation.
- Iframe close cleanup must not clear a reopened or re-minimised frame.
- About illustration reserves its actual 1280×720 aspect ratio so first opening doesn't jump when the lazy image loads.

## Verification

Local commands, all passed:

```sh
node --check script.js
node tests/michaelos-motion-regression.cjs
node tests/michaelos-motion-browser-qa.cjs
node tests/michaelos-fluid-transitions-browser-qa.cjs
node tests/mobile-bottom-ux-regression.cjs
node tests/mobile-direct-route-visibility-regression.cjs
node tests/accessibility-navigation-regression.cjs
node tests/direct-page-links-regression.cjs
node tests/site-analytics-regression.cjs
git diff --check
```

Browser matrix: Chromium 1440×1000 desktop, 390×844 touch, 1280×900 reduced-motion. New tests pause animations at a known progress to assert actual intermediate opacity and geometry. Cover open/close/minimise/restore/maximise, rapid reopen, preferences changing mid-flight, iframe reopen/minimise, hashes, single-window mobile state, overflow and page errors. Existing QA also checks dragging/resizing, sound, Start and archive, optional boot, and case-study links. Analytics is stubbed during interaction QA to avoid tracking synthetic events.

Evidence directories: `/tmp/michaelos-fluid-transitions/` and `/tmp/michaelos-motion-browser-qa/`. Screenshot review caught and corrected the lazy-image opening shift. Live verification uses `PAGE_URL=https://michaelcostea.com/` and separate `QA_OUT` directories after GitHub Pages deployment succeeds.

## Changed surfaces

- `index.html`: CSS/JS cache versions and intrinsic About illustration dimensions.
- `script.js`: managed window transitions and state/focus cleanup.
- `assets/css/michaelos-motion.css`: real-window exit surface and smooth menu/archive motion.
- `tests/michaelos-motion-regression.cjs`: updated static contract.
- `tests/michaelos-motion-browser-qa.cjs`: await transition completion; assert real motion.
- `tests/michaelos-fluid-transitions-browser-qa.cjs`: deterministic transition/interrupt tests.
- This document.

No runtime service, environment, credential, account, analytics, DNS or hosting setting changes.
