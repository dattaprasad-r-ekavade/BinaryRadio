# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

SynthReel (BinaryRadio) is a single-package client-only React + Vite SPA. There is no backend, database, or Docker compose stack. Audio runs in-browser via Strudel loaded from CDN (`unpkg.com` + `strudel.b-cdn.net` for samples). Outbound HTTPS is required for engine init and playback.

### Services

| Service | Port | Command |
|---------|------|---------|
| Vite dev server | 5173 (default) | `npm run dev` |
| Vite preview (production build) | 4173 | `npm run build && npm run preview -- --host 127.0.0.1 --port 4173` |

Playwright E2E uses port **4173** locally (`npm run dev -- --host 127.0.0.1 --port 4173`) or build+preview when `CI=true` (see `playwright.config.js`).

### Common commands

See [README.md](README.md) for the full list. Typical verification loop:

- `npm run lint` — ESLint on `src/`
- `npm run typecheck` — `tsc --noEmit` (may report pre-existing prop/type mismatches on `Deck` / `audioReady`)
- `npm test` — Vitest unit/integration (jsdom)
- `npm run build` — production bundle to `dist/`
- `npm run test:e2e` — Playwright Chromium; starts its own web server via config

### Playwright browsers

E2E requires Chromium. On a fresh VM (first time only), install with:

```bash
npx playwright install --with-deps chromium
```

Subsequent runs can use `npx playwright install chromium` if system libraries are already present.

### Gotchas

- **Strudel CDN**: Engine shows `ENGINE READY` only after network fetch; allow up to ~60s on first load. E2E and manual tests must wait for this before loading a tape.
- **SharedWorker**: `index.html` disables `SharedWorker` before Strudel loads (known CDN/browser workaround).
- **WebKit/Safari**: Strudel may fail to initialize in some environments; Chromium is the supported E2E target.
- **RJ / Kokoro TTS**: Optional. Pre-generated MP3s in `public/rj/` are used at runtime; `npm run generate-rj` needs a Kokoro server (`python scripts/kokoro_server.py` or `KOKORO_URL`).
- **Node version**: `.nvmrc` specifies 20; `engines.node` is `>=20`. CI uses Node 20.
- **No git hooks**: This repo does not use husky or pre-commit hooks.

### Hello-world manual test

1. `npm run dev` → open http://127.0.0.1:5173
2. Wait for `ENGINE READY`
3. Click a cassette in the rack → click **PLAY** → confirm visualizer/VU activity and `data-deck-state="playing"`
