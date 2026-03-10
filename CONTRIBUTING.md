# Contributing to SynthReel

Thanks for contributing.

## Ground Rules

- Follow the [Code of Conduct](CODE_OF_CONDUCT.md).
- Keep changes focused and reviewable.
- Run local checks before opening a PR.

## Local Setup

```bash
nvm use 20
npm install
npm run dev
```

## Required Checks

```bash
npm run lint
npm run test
npm run build
```

## Adding a New Tune

1. Add tune file in `public/tunes/<slug>.md`.
2. Add tune metadata entry in `public/tunes/manifest.json`.
3. Keep `src/data/tracks.js` only as seed fallback data.
4. Verify load/play behavior locally.

Tune files should contain Strudel code and should not include `setcps(...)`.

## Strudel Version Policy

- Current pinned browser script: `@strudel/web@1.3.0` in `index.html`.
- Before upgrading:
  1. Update Strudel script version in `index.html`.
  2. Test boot, play/stop, radio transitions, visualizer, and WAV export.
  3. Validate `useStrudel` introspection helpers still locate audio context and output node.
- Risk note:
  - `findContext()` / `findAudioNode()` in `src/hooks/useStrudel.js` rely on runtime internals and may break across Strudel releases.

## RJ Announcements

Use:

```bash
npm run generate-rj
node scripts/generate-rj.mjs --dry-run
```

Do not commit TTS model binaries to git history.

## Type System Decision

- Current decision: stay on JavaScript for now.
- Use ESLint for guardrails while architecture is being stabilized.
- Revisit TypeScript migration after component extraction and state centralization land.

## Pull Requests

Use the provided PR template and include:

- What changed and why
- Linked issue
- Tests added/updated
- Screenshots for UI changes
