# SynthReel Future Improvements Plan (Excluding PWA)

This plan covers all items in `README.md` under **Future Improvements**, except **PWA support**.

## 0) Foundation Refactor (do first)

Goal: reduce risk before adding major features.

- Split `src/App.jsx` into focused modules:
  - `src/components/Deck.jsx`
  - `src/components/Rack.jsx`
  - `src/components/Transport.jsx`
  - `src/components/Knob.jsx`
  - `src/state/playerStore.js` (or `usePlayerState.js`)
- Centralize player state:
  - `loadedTrack`, `deckState`, `cps`, `looping`, `volume`, `eq`, `queue`, `favorites`
- Extend `useStrudel` to expose audio graph handles for analysis/effects/export.
- Add basic test setup (Vitest + React Testing Library) for controls and queue behavior.

Acceptance criteria:
- App behavior unchanged after refactor.
- Existing play/load/stop/radio flow still works.
- State transitions are test-covered for core transport actions.

## 1) Audio Core Features

### 1.1 Visualizer
- Create `useVisualizer` hook with `AnalyserNode`.
- Add switchable modes: waveform + frequency bars.
- Render via `<canvas>` in deck window; pause rendering when not playing.

Acceptance criteria:
- Visualizer updates in real time while track is playing.
- CPU use remains stable on desktop/mobile.

### 1.2 Volume & EQ Controls
- Add master gain knob and 3-band EQ (bass/mid/treble) with BiquadFilterNodes.
- Keep existing RJ volume separate from music volume.
- Save user settings to `localStorage`.

Acceptance criteria:
- Audible and immediate changes from each control.
- Values persist across reloads.

### 1.3 Export to Audio
- Add offline render path:
  - Evaluate track in `OfflineAudioContext` when possible.
  - Fallback to realtime capture via `MediaRecorder` if needed.
- Start with WAV export; MP3 optional if encoder is added.
- Add export progress + cancel UI.

Acceptance criteria:
- User can download a valid audio file for current tune.
- Export handles errors with clear UI message.

## 2) Library and Playback Management

### 2.1 Track Metadata
- Extend `tracks` manifest schema:
  - `bpm`, `key`, `moodTags`, `durationSec`
- Surface metadata in cassette labels + deck “Now Playing”.
- Add data validation script for manifest consistency.

Acceptance criteria:
- Metadata appears correctly for all tracks.
- Missing metadata does not break rendering.

### 2.2 Favourites / Playlist
- Add star toggle per track.
- Add queue panel with reorder/remove/clear.
- Add continuous playback behavior (manual mode) and coexistence rules with radio mode.
- Persist favorites/queue in `localStorage` (or IndexedDB if queue grows).

Acceptance criteria:
- Favorites survive reload.
- Queue plays in order and advances reliably.

## 3) Creation Workflow

### 3.1 Custom Tune Editor
- Add editor view (CodeMirror recommended) with Strudel syntax hints.
- Features:
  - New/open/save custom tune
  - Run/stop from editor
  - Local persistence (IndexedDB)
  - “Add to rack” action
- Add safe execution guardrails:
  - Reset/hush on runtime failure
  - Basic validation before play

Acceptance criteria:
- User can create, save, reload, and play custom tunes entirely in browser.
- Editor errors are shown without crashing the app.

## 4) UX and Accessibility

### 4.1 Keyboard Shortcuts
- Implement shortcut map:
  - Space: play/pause
  - `S`: stop
  - `N`/`P`: next/previous track
  - `+`/`-`: tempo up/down
  - `L`: loop toggle
- Ignore shortcuts when typing in editor/input fields.
- Add shortcut cheat sheet modal.

Acceptance criteria:
- Shortcuts work reliably and do not interfere with text entry.

### 4.2 Dark / Light Theme Toggle
- Introduce design tokens via CSS variables.
- Add theme toggle in header; persist choice.
- Respect system preference on first load.

Acceptance criteria:
- Theme switch updates all major surfaces with consistent contrast.
- Selection persists across sessions.

### 4.3 Mobile-Responsive Layout
- Define breakpoints for rack/deck/editor.
- Improve touch targets and knob usability.
- Optimize tape grid and controls for small screens.

Acceptance criteria:
- Fully usable layout on 360px+ width.
- No horizontal scroll in core app views.

## Suggested Delivery Sequence

1. Foundation refactor + tests
2. Volume/EQ + Visualizer (shared audio graph work)
3. Metadata + Favorites/Playlist
4. Keyboard shortcuts + theme toggle + mobile responsiveness
5. Custom tune editor
6. Export to audio (after audio graph/editor are stable)

## Risks and Mitigations

- Strudel API limitations for offline export:
  - Mitigation: ship WAV via realtime capture first, iterate to true offline render.
- Performance regression from visualizer/editor:
  - Mitigation: throttle animation, lazy-load editor bundle.
- State complexity growth:
  - Mitigation: single state layer and reducer/store before feature expansion.

## Definition of Done (Project-Level)

- All above features (except PWA) are implemented.
- Manual QA passes on desktop + mobile viewport.
- Core flows covered by automated tests:
  - load/play/pause/stop
  - queue progression
  - favorites persistence
  - keyboard shortcut behavior
  - theme persistence
