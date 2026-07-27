# SynthReel — UI review and rework

Reviewed at commit `main` (23 commits), on a clean clone. Setup, run, audit, fix, re-verify.

Verification after changes: `eslint` clean, `tsc --noEmit` clean, **31/31 tests passing** (was 24), production build succeeds, zero console errors on load in Chromium at 1280px, 390px, and in both themes.

---

## 1. Setup and baseline

```
npm install       # 423 packages, clean
npm run dev       # http://localhost:5173 — app boots, ENGINE READY
npm test          # 24/24 passing
npm run lint      # 1 error
npx tsc --noEmit  # 4 errors
```

The app worked. The problems were quality problems, not "it's broken" problems — with two exceptions noted below that would have thrown at runtime.

---

## 2. Bugs found (not cosmetic)

### 2.1 `logExportWarn` is used but never imported — `src/utils/wav.js`

```js
import { logExportError } from './exportLog'   // logExportWarn missing
...
logExportWarn('Worklet addModule failed; trying fetch + blob URL', ...)
```

This is on the WAV-export fallback path. If `audioWorklet.addModule(url)` ever failed — the exact case the fallback exists to handle — the recovery code would throw `ReferenceError` before it could recover. ESLint's `no-undef` was already flagging it; the error had simply been left in.

**Fixed:** added the import.

### 2.2 Four TypeScript errors

`scripts/export-wav.mjs` called `window.__startCapture()` / `window.__stopCapture()` — functions injected at runtime, never declared. **Fixed:** declared them in `src/types/globals.d.ts` and used optional call syntax.

### 2.3 The contrast test passed vacuously

`src/tests/accessibility.contrast.test.js` extracted theme variables with a regex that matched only the **first** `:root { … }` block. The palette is split across multiple `:root` blocks, so the map came back empty, `contrast(undefined, undefined)` returned `NaN`, and `expect(NaN).toBeGreaterThanOrEqual(4.5)` … was the only thing standing between the project and the failures in §3.1.

**Fixed:** the test now scans every matching block, asserts the tokens actually parsed as hex, and checks **every text token against every surface token in both themes** (42 pairs) plus accent legibility. It immediately caught a real failure I'd introduced (`--dimmer` on `--bg4` at 4.34:1), which is what a contrast test is for.

### 2.4 Placeholder glyphs shipped to production

`QueuePanel.jsx` rendered the move-up and move-down buttons as the literal character `?`:

```jsx
<button aria-label="Move track up" …>?</button>
<button aria-label="Move track down" …>?</button>
```

Both buttons were visually identical question marks. Remove was `X`, favorite was `*`. **Fixed:** real SVG icons throughout.

---

## 3. UI problems and what changed

### 3.1 Light theme was broken

Cassette cards hard-coded `#14141e` / `#0c0c14` / `#04040a`, and `Reel.jsx` hard-coded `#0e0e12` / `#2a2a38`. In light mode you got near-black cards and invisible reels sitting on a pale page — the single most obvious "this wasn't finished" signal in the app.

**Fixed:** every cassette and reel colour is now a token with a light-theme value. Light mode renders cream plastic shells with pale printed labels; dark mode is unchanged in spirit but now driven by the same tokens.

One subtlety worth flagging: the light labels are tinted from each track's **`accent`** colour, not its `color`. The `color` values in `data/tracks.js` (`#1b3a60`, `#3a1b50`, …) are authored for dark backgrounds; mixed toward white they all collapse into the same grey-mauve. The `accent` values are vivid, so they survive the mix and the tapes stay distinguishable. See `rack-light.png` vs `rack-dark.png`.

The token that selects which colour to use has to live on `.cas`, not `:root` — a `var(--ca)` reference declared on `:root` substitutes its *fallback* there and inherits that one literal to every card. That cost me one round-trip and is commented in `CassetteCard.css` so it doesn't get "simplified" back.

### 3.2 Secondary text failed WCAG AA everywhere (dark theme)

| Token | Was | Contrast on `--bg` | Now | Contrast |
|---|---|---|---|---|
| `--dim` | `#5a587a` | **2.94:1** ❌ | `#a6a4c6` | 7.9:1 ✅ |
| `--dimmer` | `#30304a` | **1.56:1** ❌ | `#8886ac` | 5.7:1 ✅ |

`--dimmer` at 1.56:1 was carrying the section headings ("TAPE RACK", "PLAYLIST QUEUE"), the footer, and every transport button label. All text tokens now clear 4.5:1 on all seven surface tokens, in both themes, enforced by the test in §2.3.

### 3.3 Disabled controls were invisible

`.tbtn:disabled { opacity: 0.25 }` on top of already-low-contrast text put the STOP / PLAY / START REC labels at roughly 1.5:1. With no tape loaded — the app's **initial state** — the transport row read as a smear.

**Fixed:** disabled state is now a background/colour change to tokens that still pass AA, not an opacity wash.

### 3.4 The visualizer was a dead black rectangle

When not playing, `Visualizer.jsx` drew a 6px flat bar at the bottom and nothing else. A 92px-tall black band directly under the header, on first load, reads as a rendering failure rather than an idle instrument.

**Fixed:**
- An animated low-amplitude standby trace plus faint grid rules when idle.
- Correct `devicePixelRatio` scaling — the canvas backing store was set to CSS pixels, so the trace was upscaled and soft on any HiDPI display.
- Waveform mode mapped time-domain bytes to `0..height` instead of centring on 128, so silence sat at the midpoint only by coincidence. Now explicitly centred.
- Bar heights are smoothed, so the spectrum no longer strobes.

### 3.5 The VU meters were fake

`VUMeter.jsx` rendered 20 spans with a CSS keyframe animation keyed off `--i`. The "levels" had no relationship to the audio: a silent deck with the transport running showed a moving meter, and the unlit segments used `--bg4` at 7px, which read as a row of broken grey dashes.

**Fixed:** the meters are driven by real per-channel `AnalyserNode`s. Added a `ChannelSplitter` and two small-FFT analysers to the graph in `useStrudel.js`, exposed via `getChannelAnalysers()`, and rewrote the component to compute RMS with proper peak-programme ballistics (fast attack, slow release) and a decaying peak-hold marker. With no analyser available it renders flat and unlit rather than inventing motion.

*Caveat:* the split is genuine L/R off the post-EQ bus. If Strudel's output is mono-summed upstream the two meters will legitimately track each other.

### 3.6 EQ used raw browser default sliders

Three unstyled `<input type="range">` elements with `accent-color: blue` sat inside a hand-crafted retro deck. Chrome's stock blue track and round thumb were the most off-theme pixels on the page.

**Fixed:** still native range inputs (keyboard and AT support intact), but fully restyled as faders with a knurled thumb, a **centre detent at 0 dB**, and a **centre-anchored fill** — the old left-anchored fill made "flat" look half-applied. Added a per-band value readout that doubles as a reset button, plus double-click-to-reset.

### 3.7 Cassette cards were twice as tall as their content

`aspect-ratio: 5/3` with a 42%-height "mechanism" region rendered in near-black. Eleven tapes made the rack a very long scroll, and the mechanism — pure decoration — got more vertical space than the title, description and metadata combined.

**Fixed:** content-driven height with the mechanism as a fixed 34px strip. Grid switched to `auto-fill, minmax(230px, 1fr)` so it adapts instead of stepping 3 → 2 → 1 at hard breakpoints.

**Result: the mobile page is 29% shorter (3804px → 2713px).**

### 3.8 Touch targets below minimum

The favorite and queue buttons on each card were roughly 18×16px. **Fixed:** 32px visual box with a transparent 44px hit area via `::after`, so they meet WCAG 2.2 target size without dominating the card.

### 3.9 A wall of instructions wedged into the middle of the page

Loading a tape inserted a permanently-expanded three-step WAV export tutorial between the transport and the knobs — a ~130px block of instructional prose in the highest-value real estate on the page, present whether or not you cared about exporting.

**Fixed:** collapsed into a `<details>` that auto-opens while recording. Same information, one line at rest.

### 3.10 Structural cleanup

- **Duplicate wordmark.** "SYNTHREEL" appeared in the page header *and* again in the deck plate immediately below. The plate now carries the model number and the Spectrum/Wave toggle (which was floating over the visualizer).
- **Redundant play affordance.** A large dashed "▶ PLAY — {title}" button duplicated the PLAY transport button a few hundred pixels above it. Removed.
- **Misleading state label.** Playing showed `● REC`. It is not recording. Now `PLAYING`, with a pulsing status dot.
- **Dead code.** A `REW` transport button was rendered and then hidden with `display: none !important`.
- **Unexplained disabled UI.** Enabling radio mode set `pointer-events: none; opacity: 0.35; grayscale(0.6)` on the entire rack with no explanation. Now dimmed less aggressively, with a line saying why.
- **Empty states.** "Favorites only" with no favorites rendered a blank grid. Both the rack and the queue now explain themselves.
- **Emoji as icons.** The 📼 logo and the `⏏ ⟳ ◀◀ 💾` transport glyphs rendered as tofu boxes wherever platform emoji coverage was thin (visible in the "before" screenshots). All replaced with inline SVG, which also means they inherit `currentColor` and theme correctly.
- **Status messages** moved above the deck; they previously appeared *below* the controls they described and shifted the layout when they arrived.

### 3.11 Typography and spacing had no system

`html { font-size: 125% }` scaled everything up, then individual rules pulled sizes back down to `0.44rem` — an effective **8.8px** for transport labels. Sizes ranged over 0.44–1.35rem with no scale; spacing used ad-hoc values (3px, 5px, 7px, 11px, 14px).

**Fixed:** a documented type scale with an 11px floor, a 4px-step spacing scale, radius/motion/duration tokens, and a `prefers-reduced-motion` block. The `125%` hack is gone. Every component stylesheet was rewritten against the tokens.

### 3.12 Smaller accessibility fixes

- Help modal didn't move focus on open or restore it on close — keyboard users had to tab through the whole app to reach it.
- Tune editor inputs used placeholders as their only labels. Added `aria-label` to all seven.
- Toggle buttons (Editor, Shortcuts, Favorites, Loop, Radio, visualizer mode) now expose `aria-pressed`.
- Cassette card action buttons had generic labels ("Add to queue"); now per-track ("Add Midnight Drive to queue"). Same for queue reorder controls.
- The `Knob` role="slider" had no `aria-orientation` and announced a bare number; it now announces `"0.25 cycles per second, 60 bpm"`. Added scroll-wheel control and Shift-for-fine-adjust.

---

## 4. Tests

24 → 31. The additions cover behaviour that was previously unverified:

- Contrast across all token pairs in both themes (§2.3) — replaces a test that could not fail.
- Cassette card load state and per-track action labels.
- Queue empty state, boundary reorder disabling, and remove/reorder by accessible name rather than by DOM index.
- Rack empty-favorites and radio-mode messaging.

`QueuePanel.test.jsx` was also missing `afterEach(cleanup)`, so DOM from earlier tests leaked into later ones — invisible until a query started matching two renders.

The canvas stub in `tests/setup.js` was missing methods the visualizer calls; a missing method surfaced as an unhandled rejection inside `requestAnimationFrame` rather than a readable failure. Extended and commented.

---

## 5. Measured results

| | Before | After |
|---|---|---|
| Mobile page height (390px) | 3804px | **2713px** (−29%) |
| Desktop, tape loaded | 2032px | **1730px** (−15%) |
| Smallest text | 8.8px | **11px** |
| Text tokens failing WCAG AA (dark) | 2 of 3 | **0 of 3** |
| Lint errors | 1 | 0 |
| TypeScript errors | 4 | 0 |
| Tests | 24 | 31 |

Screenshots: `before-*.png` / `after-*.png`, plus `rack-dark.png` / `rack-light.png` for the cassette treatment.

---

## 6. What I did not change, and would look at next

Ordered by what I'd tackle first.

1. **`useStrudel.js` monkey-patches `AudioNode.prototype.connect` globally** to intercept Strudel's output. It works and it's guarded, but it mutates a prototype for every node in the page, and the `isOurNode` allow-list has to be updated by hand every time a node is added to the graph (I had to extend it for the channel splitter). Strudel exposes `getAudioContext()`; wiring from that would be less fragile.

2. **`useStrudel.js` is 600 lines** covering engine bootstrap, graph wiring, three separate WAV capture strategies, and export encoding. The three capture paths in particular (worklet → script processor → MediaRecorder) are three distinct concerns in one hook.

3. **`useTransport.js` is 354 lines** and owns transport, playback, radio orchestration, theme resolution and messaging. Theme belongs somewhere else.

4. **Track colours are single-theme.** `data/tracks.js` gives each track a `color` and an `accent`. I worked around this in CSS (§3.1), but the cleaner fix is to store a hue per track and derive both themes from it.

5. **No E2E coverage of the reworked surfaces.** Playwright is configured and there's a `qa:matrix` script across seven projects, but the specs don't touch the EQ, the queue reorder controls, or theme switching. These are exactly the paths where a CSS refactor can silently break interaction.

6. **`README.md` still documents the old architecture** — it lists `usePlayerState`/`useLibrary` etc. accurately but describes components that have changed shape. Worth a pass.

7. **The 108px visualizer is a lot of vertical space** for a decorative element. It earns its place while playing; idle, a shorter strip would tighten the deck further. Deliberate call, not an oversight — flagging it as a judgement you may disagree with.

---

## 7. Files changed

34 files. No dependencies added or removed.

**Fixes:** `utils/wav.js`, `scripts/export-wav.mjs`, `types/globals.d.ts`, `types/react-cssvars.d.ts`

**Tokens and shell:** `styles/variables.css`, `styles/app.css`, `App.jsx`, `utils/themeColors.js`

**Components:** `Deck.{jsx,css}`, `CassetteCard.{jsx,css}`, `Rack.{jsx,css}`, `QueuePanel.{jsx,css}`, `VUMeter.{jsx,css}`, `Visualizer.jsx`, `Knob.{jsx,css}`, `Reel.jsx`, `HelpModal.{jsx,css}`, `TuneEditor.{jsx,css}`

**Audio graph:** `hooks/useStrudel.js`, `hooks/useTransport.js`, `hooks/usePlayerState.js`

**Tests:** `tests/accessibility.contrast.test.js`, `tests/setup.js`, `CassetteCard.test.jsx`, `QueuePanel.test.jsx`, `Rack.test.jsx`
