# Manual QA Checklist

Date: 2026-03-11  
Environment: Windows, Node 22, local dev server (`vite`)  
Command used for cross-browser smoke: `npm run qa:matrix`

## Scope

- Desktop: Chromium, Firefox, WebKit
- Mobile: Playwright `Pixel 5` emulation (width >= 360px)
- Core scenarios:
  - Load tune and play
  - Favorites filter
  - Keyboard shortcuts (`Space`, `S`, `N`, `P`)
  - Theme persistence across reload

## Results

| Target | Load/Play | Favorites Filter | Keyboard Shortcuts | Theme Persist | Overall |
| --- | --- | --- | --- | --- | --- |
| Chromium (Desktop) | Pass | Pass | Pass | Pass | Pass |
| Firefox (Desktop) | Pass | Pass | Pass | Pass | Pass |
| WebKit (Desktop Safari engine) | Fail | Pass | Fail | Pass | Fail |
| Mobile Chrome (Pixel 5) | Pass | Pass | Pass | Pass | Pass |

## Notes

- WebKit fails in this environment with `ENGINE ERROR` (Strudel engine initialization), which blocks play/keyboard transport scenarios.
- This matches the known Strudel/browser compatibility caveat already tracked in README (`SharedWorker`/engine instability).

## Follow-up

1. Re-run WebKit checks on a real macOS Safari setup.
2. If reproducible, keep WebKit as known limitation and gate release criteria to Chromium/Firefox + mobile until upstream fix.
