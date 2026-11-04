# SynthReel 3D: the 80s listening room

Status: proposal · Owner: TBD

## The idea

On page load you step into a small 1980s bedroom or den. Against the far wall
is a table with:

- **A cassette deck**, the main player. It loads, plays, pauses, stops and records tapes.
- **A tape rack** on top of the deck, holding every tape in the manifest as a physical cassette.
- **A beige home computer** with a CRT monitor beside it. This is where you write and edit tunes.
- **A synth keyboard** on the other side. Playing it sounds notes that fit the key of the tape currently playing.

## Is it possible?

Yes, and the current codebase is a good starting point. All of the
application logic (`usePlayerState`, `useTransport`, `useQueue`,
`useRadioMode`, `useStrudel`) is separate from the 2D components. The 3D room
can be **a second view on the same state**: the tapes, audio engine, queue,
radio mode and saved data all stay the same. Only what you see and click on
changes.

The hard parts are art (modelled, lightweight 3D assets), performance on
phones, and accessibility. None of them block the project; they shape it.
The plan below handles each one.

## Technology

| Concern | Choice | Why |
| --- | --- | --- |
| 3D rendering | **three.js** with **@react-three/fiber** (R3F) | Fits the React app; components and hooks work in the 3D scene |
| Helpers | **@react-three/drei** | `useGLTF`, `Html`, `CameraControls`, `useCursor`, `Bvh`, `PerformanceMonitor` |
| Post effects | **@react-three/postprocessing** (optional) | Bloom on LEDs and the CRT, film grain, slight blur at the edges of the view |
| Animation | drei `CameraControls` and small spring animations (`@react-spring/three` or `maath`) | Moving the camera between objects; tape loading animation |
| Assets | Blender → **glTF/GLB**, Draco or Meshopt compression, **KTX2** textures, baked lightmaps | Small downloads, fast to draw, warm room lighting without real-time lights |
| Audio | Existing Strudel engine plus a small keyboard synth (see below) | No change to how tunes play |

Load the 3D view as a separate chunk (`lazy(() => import('./scene/Room'))`)
so the 2D app and people who choose it never download three.js
(about 150–200 kB gzipped with R3F and drei).

## Experience

### 1. Entrance (about 4 seconds, skippable)

- The page shows a dark hallway and a door with a "PRESS TO ENTER" sign.
- **The click to enter is the user action that browsers require before audio can start.** It
  unlocks the `AudioContext` and starts loading Strudel, so by the time you
  are in the room the engine is usually ready. Today that unlock happens on
  the first PLAY.
- The camera moves through the door and settles on a view of the whole table.
  Show a "Skip intro" button, and skip the intro automatically when `prefers-reduced-motion` is set.
- A shaded lamp on the deck lights up as **the engine status light**: amber while loading, warm white when
  ready, red with a "Retry" label when offline (the same state as the 2D
  header).

### 2. Moving around

Use **fixed viewpoints, not free walking**. Free WASD movement is fun on a
desktop, but awkward on phones and with a keyboard only. Instead, set up four
camera positions that move smoothly between each other:

1. Overview (the whole table)
2. Deck and rack
3. Computer
4. Keyboard

Click an object to move to its viewpoint. Esc or a "back" control returns to
the overview. Allow small mouse or device-tilt movement at each viewpoint so
the room feels alive. A free-walk mode can be added later behind a toggle.

### 3. Deck and rack

- Each tape in `manifest.json` becomes a cassette in the rack. Use one shared
  model instanced for all tapes; the label texture is generated at runtime on
  a canvas from the track's `title`, `emoji`, `color` and `accent`, so new
  tapes need no art.
- Hovering a tape slides it slightly out of the rack and shows a tooltip with
  title, BPM and mood tags. Clicking it plays an animation: the tape flies out,
  the cassette door opens, the tape drops in, the door closes, and
  `radioLoad(track)` is called.
- The reels spin at a speed driven by `cps`. The tape on the left reel shrinks
  and the right reel grows over `durationSec`.
- STOP / PLAY / PAUSE / LOOP / REC are physical piano-key buttons that press
  down and then call the existing transport actions.
- The tempo, volume and RJ volume knobs reuse the drag logic from `Knob.jsx`
  (circular or straight drag) through a pointer handler on each mesh.
- **VU meters have real needles.** Drive them from the existing per-channel
  analysers (`channelAnalysers.left` and `.right`) with a little needle inertia.
- The queue is a small pile of tapes next to the deck, in play order. Drag a
  tape from the rack onto the pile to queue it.
- RJ radio is a radio on the shelf. When it's on, a red "ON AIR" light glows,
  and the DJ voice comes out of the radio's speaker using a `PannerNode`
  positioned at the radio.

### 4. The computer

- An original beige desktop with a curved CRT (do not use any real brand).
- **Show the editor on the screen with drei `<Html transform occlude>`**,
  rendering the existing `TuneEditor` component onto the monitor surface. It
  stays real DOM, so typing, selecting text, the screen reader and the clipboard all
  work. A CRT shader overlay (scanlines, glow, slight curve) goes on top.
- A boot screen ("SYNTHREEL OS v1.0, 640K OK") the first time you visit the
  computer.
- Actions on the screen: *New tape* (blank template), *Edit current tape*
  (opens the loaded tape's code), *Play draft*, *Save to rack*. Saving creates
  a new cassette that drops into the rack (custom tunes already persist in
  `localStorage`).
- Later: a "Share" command that compresses the tune into a URL (`#tape=…`) so
  someone else's room opens with that cassette in their rack.

### 5. The keyboard

- About 2 octaves (25 keys). Play it by clicking or touching keys, or with the
  computer keyboard in a two-row piano layout (`A W S E D F T G Y H U J K`
  plus `Z`/`X` to shift octave), or with **Web MIDI** for a real controller.
- **Notes match the current tape.** The manifest already stores `key` per
  tape (for example `Dm`, `F#m`, `C Bhairav`, `slendro`). Parse it into a root
  note and a scale, and add a **Scale lock** switch on the keyboard:
  - Off: chromatic, every key plays its own note.
  - On: each key snaps to the nearest note in the tape's scale, so anything you
    play fits the tape. Show keys outside the scale as dimmed.
  - Also add a toggle to snap note timing to the tape's beat
    (cps × beats per cycle).
- **Sound:** start a small separate Web Audio synth (two oscillators, filter,
  envelope, routed through the same EQ and master gain as the deck so volume
  and EQ apply). It responds faster than evaluating a new Strudel pattern for
  every key press. Later, change the patch to match the tape's lead sound (saw
  for Midnight Drive, FM bells for Lantern Procession). Store this as an
  optional `keyboardPatch` field per tape in the manifest.
- **Record a jam:** a REC button on the keyboard records notes with their
  cycle positions and turns them into a Strudel `note("…")` line, which opens
  on the computer as a new tape. This ties all three objects together: play,
  edit, save to the rack, then play it on the deck.

### 6. Room atmosphere

- Window: sky colour follows the listener's local time; rain on the glass when
  a tape tagged `rain` is playing.
- The lamp, a lava lamp and the LEDs pulse with the music level (the existing
  analyser).
- Posters and other wall items are **original artwork only**: no copies of
  real album covers, games or brands.
- Optional room ambience: a quiet hum and a faint vinyl/tape hiss.
- Day / night setting reuses the existing light/dark theme.

## Accessibility and fallbacks (required)

- **The 2D deck stays.** It is the fallback when WebGL is unavailable, a
  low-power device is detected (`PerformanceMonitor` drops below target), or
  the user picks "Classic view". Save that choice per visitor.
- `prefers-reduced-motion`: skip the intro, shorten camera moves, turn off
  camera wobble.
- Keyboard: Tab moves between viewpoints and objects in order (deck buttons
  → knobs → rack → computer → keyboard); existing shortcuts still work. Each
  interactive mesh has a matching off-screen DOM element for screen readers,
  and the live region in `App.jsx` keeps announcing what's playing.
- The existing e2e tests keep running against Classic view. Add a smoke test
  for the 3D view with stable test IDs on the overlay controls.

## Performance budget

| Target | Budget |
| --- | --- |
| Initial 3D download (models + textures, compressed) | ≤ 4 MB, rest loaded later |
| Draw calls | ≤ 120 (instance the cassettes, merge static furniture) |
| Triangles | ≤ 300k |
| Frame rate | 60 fps on a mid-range laptop, ≥ 30 fps on a mid-range phone (render at device pixel ratio ≤ 1.5) |
| Time to enter room | < 3 s on a broadband connection after the click |

Techniques: baked lighting (no real-time shadows except one small contact
shadow), KTX2 textures, `frameloop="demand"` when nothing is moving, and
lazy-load the computer and keyboard detail until you go to them.

## Code structure

```text
src/
  scene/
    Room.jsx            // Canvas, lighting, viewpoint camera rig
    Entrance.jsx
    Deck3D.jsx          // buttons, knobs, reels, VU needles → transport actions
    Rack3D.jsx          // instanced cassettes, runtime label textures
    Computer3D.jsx      // CRT + <Html> TuneEditor
    Keyboard3D.jsx
    useViewpoints.js
    useLabelTexture.js
  audio/
    keyboardSynth.js    // small polyphonic Web Audio synth on the master bus
    scales.js           // parse manifest `key` into root + scale; snap note to scale
    jamRecorder.js      // notes → Strudel pattern text
public/models/room.glb
```

`App.jsx` chooses between `<ClassicView/>` (today's layout) and
`<RoomView/>`. Both get the same `usePlayerState()` result. `useStrudel` needs
one small addition: expose the master input node (before the EQ) so the
keyboard synth goes through the same EQ, master gain and analysers.

## Phases

| Phase | What ships | Rough effort |
| --- | --- | --- |
| 0. Prep | Fix track metadata (several `key` values don't match the code; see the review), expose master input node, `scales.js` with unit tests | 2–3 days |
| 1. Greybox room | R3F canvas with simple placeholder shapes for each object, viewpoint camera, deck buttons/knobs wired to the transport, Classic/Room toggle | 1 week |
| 2. Rack + loading | Instanced cassettes with runtime labels, load animation, reel spin, VU needles, queue pile | 1 week |
| 3. Keyboard | Synth, QWERTY + touch + Web MIDI, scale lock, timing snap | 1 week |
| 4. Computer | CRT `<Html>` editor, boot screen, save to rack | 3–5 days |
| 5. Art pass | Final Blender models, baked lighting, CRT shader, post effects, room atmosphere | 2–3 weeks (most depends on art) |
| 6. Entrance + polish | Door intro, lamp status light, spatial DJ voice, performance tuning, a11y pass, e2e smoke test | 1 week |
| 7. Extras | Jam recorder → tape, share links, free-walk mode, a second deck for DJ mixing | open-ended |

Phases 1–4 deliver a fully usable 3D version with simple art; phase 5 is
where it starts to look good. Each phase can be merged on its own behind the
Classic/Room toggle.

## Risks

- **Art takes the most time.** Mitigation: begin with simple stylised low-poly
  models and flat colours (which also suits the 80s look), and do detailed art
  later.
- **Mobile performance and battery.** Mitigation: performance budget above,
  `PerformanceMonitor` lowers quality or switches to Classic view
  automatically.
- **Text in `<Html transform>` can look blurry** at some angles and zoom
  levels. Mitigation: the computer viewpoint looks straight at the screen;
  offer a "full screen editor" button that opens the 2D editor.
- **Keyboard latency** on some Android devices. Mitigation: own synth on the
  same `AudioContext`, `latencyHint: 'interactive'`, and a short note in the UI
  if the measured output latency is high.
- **Scale lock needs correct `key` metadata.** Mitigation: phase 0, plus a
  test that every manifest `key` parses.
- **Originality:** every model, poster and brand in the room must be
  original. No real deck, computer or keyboard brand names, logos or exact
  likenesses.
