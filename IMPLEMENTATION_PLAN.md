# SynthReel — Implementation Plan

Comprehensive roadmap to take SynthReel from a working prototype to a polished, contributor-ready open source project.

**Current Rating: 5.5 / 10 — Target: 10 / 10**

---

## Phase A: OSS Infrastructure (5.5 → 7.5)

> Priority: **Do these first** — they unblock contributors and build trust.

### A1. ESLint + Prettier

- [x] Install `eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `prettier`
- [x] Add `.eslintrc.cjs` (or `eslint.config.js` flat config) with React rules
- [x] Add `.prettierrc` with consistent style (single quotes, trailing commas, 100 width)
- [x] Add npm scripts: `"lint": "eslint src/"`, `"format": "prettier --write src/"`
- [x] Run `format` once to normalize the entire codebase

### A2. GitHub Actions CI

- [x] Create `.github/workflows/ci.yml`
- [x] Pipeline: `npm ci` → `npm run lint` → `npm run build` → `npm test`
- [x] Trigger on `push` and `pull_request` to `main`
- [x] Add CI status badge to README

### A3. CODE_OF_CONDUCT.md

- [x] Add `CODE_OF_CONDUCT.md` using the [Contributor Covenant v2.1](https://www.contributor-covenant.org/)
- [x] Link from README and CONTRIBUTING

### A4. SECURITY.md

- [x] Create `SECURITY.md` with:
  - Supported versions
  - How to report vulnerabilities (email / GitHub Security Advisories)
  - Expected response timeline

### A5. CHANGELOG.md

- [x] Create `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/) format
- [x] Document current state as `v1.0.0` — all existing features
- [x] Future releases follow semver

### A6. GitHub Issue Templates

- [x] Create `.github/ISSUE_TEMPLATE/bug_report.md` — steps to reproduce, expected vs actual, browser info
- [x] Create `.github/ISSUE_TEMPLATE/feature_request.md` — problem statement, proposed solution, alternatives
- [x] Create `.github/ISSUE_TEMPLATE/new_tune.md` — tune submission template

### A7. Pull Request Template

- [x] Create `.github/PULL_REQUEST_TEMPLATE.md` with checklist:
  - Description of changes
  - Related issue
  - Tests added/updated
  - Lint passes
  - Screenshots (if UI change)

### A8. README Overhaul

- [x] Replace "Future Improvements" with **Features** section listing what's already built
- [x] Add screenshot or GIF of the cassette deck UI
- [x] Add CI badge, license badge, Node version badge
- [x] Add "Architecture" section explaining project structure
- [x] Add "Keyboard Shortcuts" quick reference table
- [x] Ensure source repo link is correct

### A9. Node Version & Package Metadata

- [x] Add `.nvmrc` file with `20`
- [x] Add `"engines": { "node": ">=18" }` to `package.json`
- [x] Add `"license": "AGPL-3.0-or-later"` to `package.json`
- [x] Decide on `"private": true` vs publishable — document the decision

### A10. .editorconfig

- [x] Add `.editorconfig` for consistent whitespace across editors/IDEs

---

## Phase B: Code Quality & Architecture (7.5 → 9.0)

> Priority: **Critical for contributor experience.** The monolith App.jsx must be broken up.

### B1. Component Extraction from App.jsx (1016 lines → ~200 lines)

Extract these self-contained components into `src/components/`:

- [ ] `Knob.jsx` — SVG circular potentiometer (zero shared state)
- [ ] `Reel.jsx` — spinning cassette reel SVG
- [ ] `Visualizer.jsx` — canvas spectrum/waveform display
- [ ] `VUMeter.jsx` — animated level indicators
- [ ] `Deck.jsx` — cassette player interface (transport controls, visualizer, knobs)
- [ ] `CassetteCard.jsx` — individual tape in the rack
- [ ] `QueuePanel.jsx` — playlist queue with reorder/remove/clear
- [ ] `Rack.jsx` — 3-column grid of cassettes with search/filter
- [ ] `TuneEditor.jsx` — in-browser Strudel code editor
- [ ] `HelpModal.jsx` — keyboard shortcuts cheat sheet
- [ ] Keep `App.jsx` as the thin orchestrator (~200 lines max)

Acceptance criteria:
- App behavior unchanged after extraction
- Each component in its own file with clear props interface
- No circular dependencies

### B2. Centralized State Management

- [ ] Create `src/hooks/usePlayerState.js` (or `src/state/playerContext.js`)
- [ ] Consolidate the 20+ `useState` calls in App.jsx into a single state hook/context
- [ ] Group state: transport (play/stop/cps/loop), library (tracks/favorites), queue, UI (theme/view/modal)
- [ ] Use `useReducer` for complex state transitions

Acceptance criteria:
- Single source of truth for player state
- Components receive only the state they need via props or context

### B3. Component Tests (React Testing Library)

- [ ] `Knob.test.jsx` — renders, drag interaction changes value
- [ ] `CassetteCard.test.jsx` — renders metadata, click triggers load
- [ ] `Rack.test.jsx` — renders all tracks, search filters correctly
- [ ] `QueuePanel.test.jsx` — reorder, remove, clear operations
- [ ] `Deck.test.jsx` — transport button states reflect deckState
- [ ] `TuneEditor.test.jsx` — save/load custom tune, validation errors shown

### B4. Integration Tests

- [ ] Test: load tune file → parse → normalize → ready for playback
- [ ] Test: `useStrudel` initialization → ready state → error state
- [ ] Test: `useRadioMode` state machine: idle → playing → announcing → next
- [ ] Test: WAV export produces valid RIFF header

### B5. Error Boundary

- [x] Add `<ErrorBoundary>` component wrapping Strudel-dependent UI
- [x] Graceful fallback UI with "Reload" button
- [x] Log errors to console with context (track name, strudel state)

### B6. Document the SharedWorker Hack

- [x] Add code comment in `index.html` explaining why `window.SharedWorker = undefined`
- [x] Link to the relevant Strudel issue/discussion
- [x] Add note in README "Known Issues" section

### B7. PropTypes or TypeScript

- [ ] Add PropTypes to all extracted components at minimum
- [ ] Optional: consider TypeScript migration (create `tsconfig.json`, rename files incrementally)
- [x] Document the decision in CONTRIBUTING.md

### B8. CSS Modularization

- [ ] Split `App.css` (663 lines) into per-component CSS files or CSS modules
- [ ] Each component imports its own styles
- [ ] Shared design tokens remain in a `variables.css` or `:root` block

---

## Phase C: Feature Completeness & Polish (9.0 → 10)

> Priority: Final mile — these elevate the project from "good" to "showcase quality."

### C1. Dynamic Tune Loading

- [x] Load tunes from `public/tunes/manifest.json` at runtime instead of hardcoded `tracks.js`
- [x] `tracks.js` becomes the fallback/seed data
- [x] Contributors can add tunes by only editing `manifest.json` + adding a `.md` file
- [x] Validate manifest schema on load

### C2. PWA Support

- [x] Add `manifest.webmanifest` with app icons, theme color, display mode
- [x] Add service worker for offline caching of core assets
- [x] Cache Strudel CDN bundle for offline playback
- [x] Add install prompt UI

### C3. Accessibility Audit

- [ ] Add ARIA labels to all interactive elements (knobs, buttons, transport controls)
- [ ] Ensure keyboard focus management (tab order, focus rings)
- [ ] Screen reader testing: announce track changes, play state
- [ ] Color contrast check for both themes (WCAG AA minimum)
- [ ] Knob interaction: add keyboard control (arrow keys) alongside mouse/touch

### C4. RJ (Radio DJ) Documentation & Graceful Degradation

- [x] Document `npm run generate-rj` in README with prerequisites (Kokoro TTS server)
- [x] Make radio mode work gracefully when no RJ audio files exist (skip announcements)
- [x] Add `--dry-run` flag to `generate-rj.mjs` for testing without TTS server

### C5. End-to-End Tests (Playwright)

- [ ] Install Playwright
- [ ] Test: load app → click tape → press play → verify audio context created
- [ ] Test: search/filter rack → correct tapes shown
- [ ] Test: keyboard shortcuts work (space, S, N, P)
- [ ] Test: theme toggle persists across reload
- [ ] Add E2E to CI pipeline

### C6. Strudel Upgrade Strategy

- [x] Document current Strudel version (`@strudel/web@1.3.0`) in CONTRIBUTING.md
- [x] Document how to test a Strudel version bump
- [x] Document the `findContext()` / `findAudioNode()` introspection risk
- [x] Add a Strudel version check on startup with console warning if mismatched

### C7. Performance Optimization

- [ ] Lazy-load TuneEditor (React.lazy + Suspense) — it's heavy and rarely used
- [ ] Throttle visualizer animation to 30fps on low-end devices
- [ ] Profile and optimize `extractSampleSelectors()` regex for large tune files
- [ ] Add `loading="lazy"` to any images if added

### C8. Demo & Deployment

- [ ] Deploy to GitHub Pages or Vercel (add deploy script / GitHub Action)
- [ ] Add live demo link to README
- [x] Add Open Graph meta tags for social sharing preview
- [ ] Record a 30-second demo GIF for README

---

## Delivery Sequence (Suggested)

```
Phase A (OSS Infra) ──────────────────────────────────────►
  A1 Lint/Format
  A2 CI Pipeline
  A3-A7 Community Files
  A8-A10 README + Config

Phase B (Code Quality) ───────────────────────────────────►
  B1 Component Extraction  ← highest impact single task
  B2 State Centralization
  B3-B4 Tests
  B5-B8 Cleanup

Phase C (Polish) ─────────────────────────────────────────►
  C1 Dynamic Tunes
  C3 Accessibility
  C5 E2E Tests
  C8 Deploy + Demo
  C2 PWA (optional)
  C4, C6, C7 Maintenance
```

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Strudel version bump breaks `findContext()` / `findAudioNode()` introspection | Pin version, add startup check, document upgrade process |
| Component extraction introduces regressions | Extract one at a time, run full test suite after each |
| Visualizer / editor causes performance regression | Lazy-load editor, throttle canvas, profile on low-end device |
| State centralization is a large refactor | Use `useReducer` incrementally, keep localStorage sync layer |
| Contributors blocked by monolith App.jsx | Prioritize B1 above all other Phase B tasks |

---

## Definition of Done (10/10)

- [ ] All Phase A items complete — CI green, linting enforced, community files in place
- [ ] All Phase B items complete — components extracted, tests passing, error boundary active
- [ ] Key Phase C items complete — accessibility, E2E tests, live demo deployed
- [ ] README has screenshot/GIF, architecture diagram, badges, and accurate feature list
- [ ] A new contributor can clone, install, lint, test, and submit a PR within 15 minutes
- [ ] Manual QA passes on desktop + mobile (360px+) in Chrome, Firefox, Safari
