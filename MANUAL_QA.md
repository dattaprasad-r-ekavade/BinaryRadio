# Manual QA Checklist

Date: 2026-03-11
Environment: Windows, Node 22, Playwright browser matrix + local run
Command: `npm run qa:matrix` (sequential, 1 worker)

## Scope

- Chrome desktop (latest Playwright Chromium)
- Firefox desktop (latest Playwright Firefox)
- Safari/WebKit desktop (latest Playwright WebKit)
- Chrome mobile at 375px viewport (`mobile-chrome-375`)
- Chrome mobile at 360px viewport (`mobile-chrome-360`)
- PWA installability checks
- Offline behavior after first visit

## Automated matrix result

- Result: **28 passed / 28 total**
- Coverage: load/play, favorites filter, keyboard shortcuts, theme persistence

## Detailed results

| Target | Load/Play | Favorites | Keyboard | Theme Persist | Layout | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| Chrome Desktop | Pass | Pass | Pass | Pass | Pass | Pass |
| Firefox Desktop | Pass | Pass | Pass | Pass | Pass | Pass |
| Safari / WebKit Desktop | Pass | Pass | Pass | Pass | Pass | Pass |
| Chrome Mobile 375px | Pass | Pass | Pass | Pass | Pass | Pass |
| Chrome Mobile 360px | Pass | Pass | Pass | Pass | Pass | Pass |

## PWA checks

| Check | Result | Notes |
| --- | --- | --- |
| Install prompt / installability | Pass | Manifest + service worker registration active; install UX path available via app Install control when browser exposes install event. |
| Offline behavior after first visit | Pass | Service worker active; core shell and previously fetched assets available from cache. |

## Notes

- Cross-browser runs are stable when executed sequentially (`--workers=1`) in local QA matrix.
- No layout breakage observed at 360px width.
