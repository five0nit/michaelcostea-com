# MichaelCostea.com Hyperframes Style Guidelines

_Last updated: 2026-06-30_

## Direction

The approved site direction is **MichaelOS × Nous field-note × Hyperframes**.

It should feel like:

- a Win98/MichaelOS desktop shell,
- containing off-white Nous-style field-note documents,
- with selective nested dimensional frames around important surfaces.

Hyperframes are not a total redesign language. They are a **premium accent system** layered onto the existing MichaelOS/Nous style.

## Core visual formula

```text
blue MichaelOS desktop
→ grey Win98 window chrome
→ cream/off-white document canvas
→ black-bordered content modules
→ cyan/teal/green/yellow offset frame rails
→ practical AI-operator copy
```

## Approved live implementation

Current live deployment:

- Commit: `71e04bc`
- Live URL cache marker: `?v=hyperframes-live-71e04bc`
- CSS file: `assets/css/hyperframes-live.css`
- Homepage body class: `hyperframes-live`
- Hyperframes CSS marker: `assets/css/hyperframes-live.css?v=20260630-live-1`

Preview route used before live promotion:

- `preview/hyperframes/index.html`
- `preview/hyperframes/hyperframes.css`

## What to keep

### Shell

- Keep the MichaelOS / Win98 desktop shell.
- Keep blue desktop background.
- Keep movable-looking grey windows, title bars, close controls, Start/taskbar system.
- Do not remove the playful OS metaphor unless Mike explicitly asks.

### Document surface

- Keep the inner Nous-style field-note paper:
  - off-white / cream canvas,
  - heavy black borders,
  - practical artifact labels,
  - subtle halftone/dot texture where useful,
  - typewriter/mono metadata accents.

### Hyperframes

Use Hyperframes around major surfaces only:

- welcome portrait/nav panel,
- main welcome copy/field-note panel,
- Agentic deck preview/slideshow areas,
- important resource cards,
- project/agent cards where it improves hierarchy.

Hyperframe styling should usually include:

- black primary shadow,
- cyan/teal secondary rail,
- occasional green/yellow offset rail,
- small dark micro-label such as `HYPERFRAME 01 · NAV SURFACE`,
- enough spacing so the rail feels intentional, not cluttered.

## What not to do

- Do **not** put heavy Hyperframes on every tiny card.
- Do **not** reintroduce the `HYPERFRAMES PREVIEW` badge on production.
- Do **not** use generic SaaS gradient cards.
- Do **not** remove Mini Michael / fun site-art assets unless Mike explicitly asks.
- Do **not** squeeze desktop into mobile; mobile needs its own framed layout.
- Do **not** bring Agent Office back into the Start menu. It should remain as a desktop icon only unless Mike asks otherwise.

## Mobile rules

Mobile must stay readable and centered.

Current verified live metrics from deployment:

- viewport width: `393`
- `scrollWidth = 393`
- no horizontal scroll,
- reader window delta: `0px`,
- welcome sidebar/copy delta: about `3px`,
- CTA image backgrounds transparent.

Mobile layout rules:

- Keep safe gutters.
- Center the outer window and inner panels separately.
- Use a centered two-column nav/button grid.
- Keep portrait centered above mobile nav.
- Avoid more than 1–2 strong Hyperframes in a single mobile viewport.
- Keep Start/taskbar only if it does not create horizontal overflow.

## CTA / image-button transparency rule

The approved live Hyperframes style requires CTA image tiles to blend into the paper surface.

For image CTA buttons:

- panel/card/image backgrounds should be transparent,
- image bottom border should be removed,
- use `mix-blend-mode: multiply` where white raster backplates appear,
- preserve clickable border/shadow affordance.

Verified expected computed styles:

```text
panel background: rgba(0, 0, 0, 0)
card background: rgba(0, 0, 0, 0)
image background: rgba(0, 0, 0, 0)
image blend mode: multiply
```

## Deck / slideshow rules

For the Agentic Framework deck:

- Hash route must keep working: `#agentic-framework-session`.
- Fullscreen must be a real fixed viewport overlay, not a bigger slide trapped in a Win98 window.
- Keep keyboard/close controls working.
- Cache markers and downloadable PDF/PPTX links should stay aligned with latest generated assets.

## QA checklist before changing/deploying

Run at minimum:

```bash
node tests/ai-help-content-regression.cjs
node tests/direct-page-links-regression.cjs
```

Use Playwright or browser QA to verify:

- live CSS marker loaded,
- `body` has `hyperframes-live`,
- no `HYPERFRAMES PREVIEW` badge in production,
- mobile `scrollWidth === innerWidth`,
- welcome reader/sidebar/copy centered,
- CTA image tile backgrounds transparent,
- Start menu opens,
- Agent Office stays off Start menu but remains on desktop,
- `#agentic-framework-session` opens the deck window,
- deck fullscreen overlay fills viewport.

## Deployment pattern

When promoting changes:

1. Test locally at repo root.
2. Capture mobile and desktop screenshots.
3. Commit focused files only.
4. Push to `main`.
5. Watch GitHub Pages deployment.
6. Verify public live URL with cache marker.
7. Record team-sync project change and activity.

## Current production files

- `index.html`
- `assets/css/hyperframes-live.css`
- `assets/css/nous-michael-live.css`
- `styles.css`
- `script.js`

The Hyperframes layer is intentionally separate from `nous-michael-live.css` so it can be adjusted or removed without destroying the underlying MichaelOS/Nous style.
