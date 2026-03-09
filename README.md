# 📼 DialTone — Retro Cassette Music Deck

A browser-based retro cassette deck that plays generative music tracks written in [Strudel](https://strudel.cc) live-coding syntax.

**[☕ Buy me a chai](https://buymeachai.ezee.li/datathecodie)**

## Features

- Cassette rack UI — pick and load any tape
- Live tempo control (CPS / BPM)
- Loop toggle
- 6 built-in ambient / synthwave / chiptune tracks
- Powered by [Strudel](https://strudel.cc) — runs entirely in the browser, no backend needed

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Building for production

```bash
npm run build
# output is in dist/
```

## Adding your own tunes

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Tech stack

- [React 18](https://react.dev) + [Vite 6](https://vitejs.dev)
- [Strudel](https://strudel.cc) (`@strudel/web@1.3.0`) via CDN
- Pure CSS (no UI framework)
