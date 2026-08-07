# MichaelOS Memory Gravity

Original browser-native retro animation for `michaelcostea.com`.

## Direction

**MichaelOS × field-note Hyperframes × monitored data field.** The animation tells one system story:

`BOOT → MAP → ORCHESTRATE → PROVE → SHIP`

A deterministic canvas field turns business signals into a mapped topology, governed swarm, evidence-bearing `M`, and operator-owned system. The Win98 shell, hard bevels, cream paper, cyan/teal/green/yellow rails, terse operator copy, stepped timing, and taskbar follow the site’s established MichaelOS language.

## Source translation

Principles were translated, not copied:

- [Dribbble Popular](https://dribbble.com/shots/popular): neutral shell, vivid focal content, repeated gallery rhythm, selective depth.
- [CodePen Trending](https://codepen.io/trending): code-to-output narrative, small repeated motion units, dark stage.
- [The Life of a Singularity](https://codepen.io/VoXelo/pen/VYKMNwE): sparse telemetry above a monitored simulation. The headless reference capture did not visibly render its particle field, so no unverified trajectory or source implementation was reused.
- [michaelcostea.com](https://michaelcostea.com): MichaelOS, field-note paper, Hyperframes, operator-first systems copy.

No external library, copied Pen source, copied artwork, or production-root mutation.

## Run

From repository root:

```bash
python3 -m http.server 4174 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4174/preview/michaelos-memory-gravity/
```

## Controls

- Move pointer: bend the field.
- Click/tap the field: emit a quantized pulse.
- Select any execution phase: jump directly to it.
- Replay / Pause: control the cycle.
- Sources: open the visible inspiration receipt.

`prefers-reduced-motion: reduce` renders a static PROVE state and disables the loop.

## Verification

```bash
node --check preview/michaelos-memory-gravity/app.js
node tests/michaelos-memory-gravity-regression.cjs
PAGE_URL=http://127.0.0.1:4174 node tests/michaelos-memory-gravity-browser-qa.cjs
```
