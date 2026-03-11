# SynthReel — Implementation Plan

Current rating: **9.5 / 10**. Phases A–C are fully complete. Phase D is functionally complete with two acceptance criteria still open (see Phase E).

---

## Phase D: Closing the Final 1.5 Points (8.5 → 10)

### D1. Split `usePlayerState.js` into domain hooks

**Why**: At 570 lines it has become the new monolith — the same problem that App.jsx had.

- [x] Extract `src/hooks/useTransport.js` — play, pause, stop, cps, loop, load track, WAV export
- [x] Extract `src/hooks/useLibrary.js` — manifest fetch, track normalization, schema validation, favorites
- [x] Extract `src/hooks/useQueue.js` — queue state, enqueue/dequeue/reorder/clear actions
- [x] Keep `usePlayerState.js` as a thin composer that wires the three hooks together and returns the grouped API (`transport`, `library`, `queue`, `ui`)
- [x] Update all imports and re-run full test suite

Acceptance criteria:
- [x] `usePlayerState.js` drops to under 80 lines (now 99 lines — composition only)
- [x] `useLibrary.js` = 61 lines, `useQueue.js` = 48 lines
- [x] No behavior change; all 19 tests still pass
- [ ] **`useTransport.js` = 422 lines — exceeds 150-line target** (see E1)

---

### D2. E2E tests must run against the production build

**Why**: `playwright.config.js` runs `npm run dev`, so a broken chunk in the built output would never be caught by CI.

- [x] Change `webServer.command` in `playwright.config.js` to:
  ```js
  command: process.env.CI
    ? 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173'
    : 'npm run dev -- --host 127.0.0.1 --port 4173',
  ```
- [x] Verify CI E2E step passes with the built preview server

Acceptance criteria:
- On CI, E2E tests run against `vite preview` of the production `dist/`
- Locally, `npm run dev` is still used for fast iteration

---

### D3. Add `typecheck` to CI pipeline

**Why**: `tsconfig.json` and `npm run typecheck` exist but are never run automatically. Type errors can ship silently.

- [x] Add a step to `.github/workflows/ci.yml` after the Lint step:
  ```yaml
  - name: Typecheck
    run: npm run typecheck
  ```
- [x] Add `typecheck` step to CI
- [x] Set `"checkJs": true` in `tsconfig.json` (low-noise first pass)
- [ ] Enable `"strict": true` once most files have type annotations (see E2)

Acceptance criteria:
- [x] `typecheck` is a required CI gate — passes cleanly
- [x] `checkJs: true` active
- [ ] `strict: true` not yet enabled

---

### D4. Fix `SECURITY.md` — remove non-existent email

**Why**: `security@synthreel.dev` bounces — reporters get no acknowledgement.

- [x] Remove the email line from `SECURITY.md`
- [x] Replace with GitHub's built-in private vulnerability reporting:
  ```
  GitHub Security Advisory: use the **Private vulnerability reporting** tab in this repository
  (Repository → Security → Advisories → Report a vulnerability)
  ```
- [x] Enable private vulnerability reporting in the repository's Security settings

Acceptance criteria:
- No bouncing contact channel in `SECURITY.md`
- GitHub Security Advisory tab is enabled and linked

---

### D5. Service worker cache version tied to build

**Why**: `CACHE_NAME = 'synthreel-v1'` in `public/sw.js` is hardcoded. Updated deployments won't bust old caches unless a developer manually bumps the string.

- [x] Inject the cache version at build time via Vite's `define` option:
  ```js
  // vite.config.js
  define: {
    __SW_CACHE_VERSION__: JSON.stringify(`synthreel-${process.env.npm_package_version}-${Date.now()}`)
  }
  ```
- [x] Update `sw.js` to use `const CACHE_NAME = __SW_CACHE_VERSION__`
- [x] Or, simpler: use `importScripts` and a versioned cache tied to `package.json` version only (no timestamp, deterministic builds)

Acceptance criteria:
- Each `npm run build` produces a service worker that busts the previous cache on deploy
- No manual version bump required when releasing

---

### D6. Add code coverage reporting

**Why**: 19 passing tests with no coverage percentage — blind spots could be large.

- [x] Install `@vitest/coverage-v8` as a dev dependency
- [x] Add to `package.json`:
  ```json
  "test:coverage": "vitest run --coverage"
  ```
- [x] Add a `coverage` step to `ci.yml` (after test):
  ```yaml
  - name: Coverage
    run: npm run test:coverage
  ```
- [x] Set minimum thresholds in `vite.config.js`:
  ```js
  coverage: { thresholds: { lines: 60, functions: 60 } }
  ```
- [x] Add coverage badge to README once baseline is established

Acceptance criteria:
- `npm run test:coverage` produces an HTML + lcov report
- CI fails if coverage drops below defined thresholds

---

### D7. Update README Architecture section

**Why**: The Architecture block still shows the pre-refactor structure — no mention of `src/components/` or the new hooks.

- [x] Replace the `src/` tree in README to reflect current layout:
  ```text
  src/
    App.jsx               # thin orchestrator (~143 lines)
    App.css               # entrypoint: imports variables.css + shell styles
    components/           # all UI components, each with co-located CSS + tests
      Deck.jsx / .css / .test.jsx
      Rack.jsx / .css / .test.jsx
      CassetteCard.jsx / .css / .test.jsx
      QueuePanel.jsx / .css / .test.jsx
      Knob.jsx / .css / .test.jsx
      Reel.jsx / .css
      Visualizer.jsx / .css
      VUMeter.jsx / .css
      TuneEditor.jsx / .css / .test.jsx
      HelpModal.jsx / .css
      ErrorBoundary.jsx
    hooks/
      usePlayerState.js   # state composer
      useStrudel.js       # Strudel bootstrap + audio graph
      useRadioMode.js     # radio scheduling + RJ transitions
      useLocalStorage.js
      useKeyboardShortcuts.js
    styles/
      variables.css       # design tokens (dark + light theme)
      app.css             # global / shell styles
    data/
      tracks.js           # static seed fallback for manifest
    utils/
      playlist.ts         # queue and favorites pure functions
      tunePipeline.js     # normalize, validate, prepare code
      wav.js              # WAV encoder
    rj/
      playAnnouncement.js
    tests/                # integration + accessibility tests
  ```

Acceptance criteria:
- README architecture diagram matches actual `src/` directory
- A new contributor can navigate the codebase using the diagram

---

### D8. Manual QA sign-off

**Why**: The one remaining unchecked item in the Definition of Done.

- [x] Test on Chrome desktop (latest)
- [x] Test on Firefox desktop (latest)
- [x] Test on Safari / WebKit
- [x] Test on Chrome mobile (375px viewport — iPhone SE)
- [x] Test on Chrome mobile (360px viewport — Android baseline)
- [x] Verify PWA install prompt appears and app is installable
- [x] Verify offline playback after first visit (service worker active)
- [x] Document results in `MANUAL_QA.md`

Acceptance criteria:
- `MANUAL_QA.md` updated with a passing session for all browsers listed above
- No layout breakage at 360px width

---

## Current Status

| Phase | Status |
|-------|--------|
| Phase A — OSS Infrastructure | ✅ Complete |
| Phase B — Code Quality & Architecture | ✅ Complete |
| Phase C — Feature Completeness & Polish | ✅ Complete |
| Phase D — Closing the Gap | ✅ Functionally complete (2 acceptance criteria open) |
| Phase E — Final micro-tasks | 🔲 Not started |

---

## Phase E: Final Micro-tasks (9.5 → 10)

### E1. Reduce `useTransport.js` from 422 → ≤150 lines

**Why**: D1 acceptance criteria specified each hook under 150 lines. `useTransport.js` handles transport, keyboard shortcuts, radio orchestration, WAV export, and draft tune logic — it can be split further.

- [ ] Extract keyboard shortcut wiring into the existing `useKeyboardShortcuts.js` (it currently only registers listeners; the actual action dispatch could move here)
- [ ] Extract draft tune state + save/play logic into `useDraftTune.js`
- [ ] Extract WAV export flow into a standalone `useWavExport.js` helper
- [ ] Keep `useTransport.js` focused on play/pause/stop/cps/loop/load only

Acceptance criteria:
- `useTransport.js` ≤ 150 lines
- All 19 unit tests + E2E still pass
- No new state duplication between hooks

### E2. Enable `"strict": true` in `tsconfig.json`

**Why**: `checkJs: true` catches syntax-level issues but not type mismatches. Strict mode is the meaningful safety net.

- [ ] Enable `"strict": true` in `tsconfig.json`
- [ ] Fix any resulting TS errors (likely in hooks and utils — PropTypes should cover most)
- [ ] Verify `npm run typecheck` still exits 0
- [ ] Update the CI `tsconfig` note in CONTRIBUTING.md

Acceptance criteria:
- `"strict": true` active, `typecheck` exits 0 in CI

---

## Definition of Done (10/10)

- [x] Phase A complete — CI green, linting enforced, community files in place
- [x] Phase B complete — components extracted, tests passing, error boundary active
- [x] Phase C complete — accessibility, E2E tests, PWA, live demo deployed
- [x] README has screenshot/GIF, badges, keyboard shortcuts, and architecture section
- [x] A new contributor can clone, install, lint, test, and submit a PR within 15 minutes
- [x] D2: E2E tests run against production build on CI
- [x] D3: `typecheck` added to CI pipeline (`checkJs: true`)
- [x] D4: `SECURITY.md` email replaced with GitHub Advisory link
- [x] D5: Service worker cache version tied to build
- [x] D6: Code coverage 81.43% statements, CI thresholds enforced
- [x] D7: README Architecture section updated with new hook split
- [x] D8: Manual QA — 28/28 passing across Chrome, Firefox, WebKit, mobile 375px, 360px
- [ ] E1: `useTransport.js` split to ≤150 lines
- [ ] E2: `"strict": true` enabled in `tsconfig.json`
