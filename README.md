# 📼 SynthReel — Retro Cassette Music Deck

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

## Future Improvements

- **Visualizer** — add a real-time audio visualizer (waveform or spectrum) synced to the playing track
- **Custom tune editor** — in-browser Strudel code editor so users can write and save their own tunes without touching the filesystem
- **Track metadata** — display BPM, key, mood tags, and duration on the cassette label
- **Favourites / playlist** — let users star tracks and queue them up for continuous playback
- **Volume & EQ controls** — per-track gain knob and a simple bass/mid/treble equalizer
- **Export to audio** — render a track to a .wav / .mp3 file directly in the browser using the Web Audio API
- **PWA support** — make the app installable and playable offline via a service worker
- **Keyboard shortcuts** — play/pause, next/prev track, tempo up/down without touching the mouse
- **Dark / light theme toggle** — complement the retro aesthetic with a user-switchable palette
- **Mobile-responsive layout** — optimise the cassette rack UI for small screens and touch input

## License & Compliance

- License: GNU AGPL-3.0-or-later (see [LICENSE](LICENSE))
- Third-party notices: [NOTICE.md](NOTICE.md)
- Compliance notes: [COMPLIANCE.md](COMPLIANCE.md)
- Source code: https://github.com/dattaprasad-r-ekavade/BinaryRadio
