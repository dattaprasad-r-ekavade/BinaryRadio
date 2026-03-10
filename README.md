# SynthReel

[![CI](https://github.com/dattaprasad-r-ekavade/BinaryRadio/actions/workflows/ci.yml/badge.svg)](https://github.com/dattaprasad-r-ekavade/BinaryRadio/actions/workflows/ci.yml)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-43853d.svg)](https://nodejs.org/)

Retro cassette-deck web app for generative music using [Strudel](https://strudel.cc).

## Preview

![SynthReel cassette deck preview](docs/cassette-deck-preview.svg)

## Features

- Retro cassette deck interface with tape rack
- Track load/play/pause/stop/loop controls
- Radio mode with timed transitions
- Pre-generated RJ announcement playback (`public/rj/*.mp3`)
- Master volume + RJ volume + EQ strip
- Spectrum/waveform visualizer and VU meters
- Queue management and favorites
- In-browser tune editor
- WAV export
- Theme persistence and keyboard shortcuts
- Runtime tune loading from `public/tunes/manifest.json` with static seed fallback

## Quick Start

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Scripts

- `npm run dev` - run local dev server
- `npm run build` - production build
- `npm run preview` - preview built app
- `npm run test` - run unit/integration tests (Vitest)
- `npm run lint` - lint source files
- `npm run format` - apply Prettier formatting to `src/`
- `npm run generate-rj` - generate RJ announcement MP3 files

### RJ Generation

Prerequisite: a reachable Kokoro TTS server exposing OpenAI-compatible speech API.

```bash
npm run generate-rj
node scripts/generate-rj.mjs --force
node scripts/generate-rj.mjs --dry-run
```

If `public/rj` files are missing, radio mode skips announcements and continues playback.

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play / Pause |
| `S` | Stop |
| `N` | Next track |
| `P` | Previous track |
| `L` | Toggle loop |
| `+` / `=` | Increase tempo |
| `-` | Decrease tempo |
| `T` | Toggle light/dark theme |
| `H` | Toggle shortcuts help |

## Architecture

```text
src/
  App.jsx                 # app orchestration and UI composition
  App.css                 # UI styling
  hooks/
    useStrudel.js         # Strudel bootstrap + audio graph wiring + export
    useRadioMode.js       # radio scheduling + RJ transitions
    useLocalStorage.js    # persistence helper
    useKeyboardShortcuts.js
  data/
    tracks.js             # static seed tracks fallback
  utils/
    playlist.js           # queue and favorites helpers
  rj/
    playAnnouncement.js   # RJ transition audio loader/player
public/
  tunes/manifest.json     # runtime tune index
  tunes/*.md              # tune source files
  rj/*.mp3                # pre-generated RJ clips
scripts/
  generate-rj.mjs         # RJ clip generator
  kokoro_server.py        # optional local helper server
```

## Known Issues

- Strudel SharedWorker clockworker can fail in some CDN/browser combos.
- Workaround: `window.SharedWorker = undefined` is set in `index.html` before loading Strudel.
- Reference discussion: https://github.com/tidalcycles/strudel/pull/1129

## Governance and Community

- Contributing guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Code of conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Security policy: [SECURITY.md](SECURITY.md)
- Changelog: [CHANGELOG.md](CHANGELOG.md)
- License: [LICENSE](LICENSE)

## Project Metadata

- Node: `>=18` (recommended via `.nvmrc` = `20`)
- License: `AGPL-3.0-or-later`
- Package visibility: this repo is intentionally `"private": true` in `package.json`.
  Distribution is source-first via GitHub rather than npm publishing.

## Repository

Source: https://github.com/dattaprasad-r-ekavade/BinaryRadio
