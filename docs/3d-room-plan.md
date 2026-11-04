# SynthReel 3D: the cassette shop

Status: proposal · Owner: TBD

## The idea

On page load you are standing on a rainy street at night, outside a small
1980s cassette shop called **SynthReel Tapes**. Its neon sign is buzzing. You
push the door open, a bell rings, and inside you can:

1. **Browse.** Shelves and bins of cassettes, sorted by mood like a real
   record shop, with staff picks, new arrivals and a bargain bin.
2. **Listen.** Take a tape to the listening station at the counter and play
   it on the shop's deck, with headphones hanging beside it.
3. **Make your own.** In the demo booth at the back, a synth keyboard and a
   home computer let you play, record and edit your own tune. Your finished
   tape goes onto the shop's *Local Artists* shelf.

The in-store radio behind the counter is RJ radio mode, and the DJ voice
comes out of its speaker.

## Is it possible?

Yes, and the current codebase is a good starting point. All of the
application logic (`usePlayerState`, `useTransport`, `useQueue`,
`useRadioMode`, `useStrudel`) is separate from the 2D components. The shop
can be **a second view on the same state**: the tapes, audio engine, queue,
radio mode and saved data all stay the same. Only what you see and click on
changes.

The shop fits the existing features well:

| Existing feature | Where it lives in the shop |
| --- | --- |
| Tape rack (`manifest.json`) | Shelves and bins, sorted by `moodTags` |
| Favorites | A "hold" basket on the counter (tapes you've set aside) |
| Queue | A short stack of tapes waiting beside the listening deck |
| Deck: transport, tempo, volume, EQ, VU meters | Listening station on the counter |
| RJ radio mode | The in-store radio behind the counter |
| Tune editor and custom tunes | Demo booth computer, *Local Artists* shelf |
| WAV export | "Dub a copy" on the booth's tape duplicator |
| Light / dark theme | Shop at night (neon) or daytime (sunlight through the window) |
| Engine status | The OPEN / CLOSED sign on the door |

The hard parts are art (modelled, lightweight 3D assets), performance on
phones, and accessibility. None of them block the project; they shape it.

## Technology

| Concern | Choice | Why |
| --- | --- | --- |
| 3D rendering | **three.js** with **@react-three/fiber** (R3F) | Fits the React app; components and hooks work in the 3D scene |
| Helpers | **@react-three/drei** | `useGLTF`, `Html`, `CameraControls`, `useCursor`, `Bvh`, `PerformanceMonitor`, `Instances` |
| Post effects | **@react-three/postprocessing** (optional) | Bloom on the neon and LEDs, film grain, CRT glow |
| Animation | drei `CameraControls` and small spring animations (`@react-spring/three` or `maath`) | Moving the camera between areas; picking up and loading tapes |
| Assets | Blender → **glTF/GLB**, Draco or Meshopt compression, **KTX2** textures, baked lightmaps | Small downloads, fast to draw, warm shop lighting without real-time lights |
| Audio | Existing Strudel engine plus a small keyboard synth (see below) | No change to how tunes play |

Load the 3D view as a separate chunk (`lazy(() => import('./scene/Shop'))`)
so the 2D app and people who choose it never download three.js
(about 150–200 kB gzipped with R3F and drei).

## Shop layout

```text
 ┌──────────────────────────────────────────────────────┐
 │  DEMO BOOTH (back room, glass window)                │
 │   [keyboard]  [computer + CRT]  [tape duplicator]    │
 │   Local Artists shelf on the booth wall              │
 ├──────────────┬───────────────────────┬───────────────┤
 │  WALL SHELF  │  CENTRE BINS          │  WALL SHELF   │
 │  ambient     │  new arrivals         │  synthwave    │
 │  focus       │  bargain bin          │  night        │
 │  rain        │                       │  world / raga │
 ├──────────────┴───────────────────────┴───────────────┤
 │  COUNTER: listening deck + headphones, hold basket,  │
 │           queue stack, in-store radio, till          │
 │  WINDOW DISPLAY: staff picks        DOOR (OPEN sign) │
 └──────────────────────────────────────────────────────┘
                     street, rain, neon
```

## Experience

### 1. Arriving (about 4 seconds, skippable)

- The page shows the shopfront at night: rain, a puddle reflecting the neon
  sign, and **staff picks** in the window display.
- The sign on the door is the **engine status**: it flickers on while Strudel
  loads, reads **OPEN** when ready, and reads **CLOSED – try again** when the
  engine failed (the same state and Retry action as the 2D header).
- **The click on the door is the user action browsers require before audio
  can start.** It unlocks the `AudioContext` and starts loading Strudel, so by
  the time you are inside the engine is usually ready. A shop bell plays as
  the door opens.
- The camera moves through the door and settles on a view of the whole shop.
  Show a "Skip intro" button, and skip the intro automatically when
  `prefers-reduced-motion` is set.

### 2. Moving around

Use **fixed viewpoints, not free walking**. Free WASD movement is fun on a
desktop, but awkward on phones and with a keyboard only. Set up viewpoints
that move smoothly between each other:

1. Shop overview (from the door)
2. Shelves and bins (each shelf section is a sub-view)
3. Counter (listening station)
4. Demo booth

Click an area to move there. Esc or a "back" control returns to the previous
view. A small floor plan in a corner shows where you are and jumps to any
area. Allow slight mouse or device-tilt movement at each viewpoint so the
shop feels alive. A free-walk mode can come later behind a toggle.

### 3. Browsing

- **Shelf sections come from `moodTags`.** Each tag gets a hand-lettered
  section card (ambient, focus, rain, synthwave, night, raga…). A tape with
  several tags is shelved under its first tag; filtering by any tag is in the
  overlay.
- **New arrivals:** the most recently added manifest entries, in the centre
  bin. Add an optional `addedAt` field to the manifest; fall back to manifest
  order.
- **Staff picks:** a short hand-written list in the window display. Add an
  optional `staffPick: "Great for late-night coding"` note per tape; it shows
  on a paper tag attached to the tape.
- **Bargain bin:** generative "mystery tapes". Each is an existing tune with
  a random seed that changes tempo, filter and which parts are muted.
  Browsing the bin feels different every visit.
- Each tape in the manifest is a cassette on a shelf. Use one shared model
  instanced for all tapes; the case insert and spine text are generated at
  runtime on a canvas from `title`, `emoji`, `color`, `accent`, `bpm` and
  `key`, so new tapes need no art.
- **Interacting with a tape:**
  - Hover: the tape tilts out of the shelf and the spine lights up.
  - Click: you pick it up. It turns to show the front of the case and the
    back cover (description, BPM, key, mood tags, length).
  - Picked-up actions: **Listen** (carry to the counter and play), **Hold**
    (drop it in the hold basket = favorite), **Queue** (put it on the queue
    stack), **Put back**.
  - Dragging a tape from a shelf onto the counter also works.

### 4. Listening at the counter

- The listening deck is the existing player. Placing a tape on it plays a
  load animation: the cassette door opens, the tape drops in, the door
  closes, and `radioLoad(track)` is called.
- The reels spin at a speed driven by `cps`. The tape on the left reel
  shrinks and the right reel grows over `durationSec`.
- STOP / PLAY / PAUSE / LOOP / REC are physical piano-key buttons that press
  down and then call the existing transport actions.
- The tempo, volume, RJ volume and EQ controls are knobs and sliders on the
  deck. They reuse the drag logic from `Knob.jsx` (circular or straight drag)
  through a pointer handler on each mesh.
- **VU meters have real needles,** driven by the existing per-channel
  analysers (`channelAnalysers.left` and `.right`) with a little needle
  inertia.
- **Headphones:** clicking the headphones hanging next to the deck switches
  between "shop speakers" (a little room reverb and positional audio) and
  "headphones" (dry, centred). This is a small reverb send on the master bus.
- The **queue stack** next to the deck shows queued tapes in play order;
  drag to reorder, flick one off to remove it.
- The **hold basket** shows favorite tapes; click one to pick it up again.
- **In-store radio:** the radio behind the counter is RJ radio mode. When it
  is on, an "ON AIR" light glows, the DJ voice comes from the radio's speaker
  through a `PannerNode`, and the shop plays through the station.

### 5. The demo booth: make your own

A small glass-walled back room with a sign reading "DEMO BOOTH: record your
own tape". It holds the keyboard, a computer and a tape duplicator.

**Keyboard**

- About 2 octaves (25 keys). Play by clicking or touching keys, with the
  computer keyboard in a two-row piano layout (`A W S E D F T G Y H U J K`
  plus `Z`/`X` to shift octave), or with **Web MIDI** for a real controller.
- **Play along with any tape.** The booth has its own small deck. Load a tape
  there to play along. The manifest already stores `key` per tape (for
  example `Dm`, `F#m`, `C Bhairav`, `slendro`); parse it into a root note
  and a scale, and add a **Scale lock** switch:
  - Off: chromatic, every key plays its own note.
  - On: each key snaps to the nearest note in the tape's scale, so anything
    you play fits. Keys outside the scale are shown dimmed.
  - A second toggle snaps note timing to the tape's beat (cps × beats per
    cycle).
- **Sound:** a small separate Web Audio synth (two oscillators, filter,
  envelope), routed through the same EQ and master gain as the deck. It
  responds faster than evaluating a new Strudel pattern on every key press.
  Preset buttons on the keyboard: Saw lead, Soft pad, FM bells, Bass, plus
  "Match tape" (uses an optional `keyboardPatch` field per tape in the
  manifest).

**Recording your demo**

- **REC on the keyboard** records the notes you play with their cycle
  positions and turns them into a Strudel `note("…")` line.
- Optional **4-track layering:** record up to four parts (for example bass,
  chords, lead, drums from pads on the keyboard), each becoming a line in a
  `stack(...)`. Each track has its own mute and volume.
- The recording opens on the **computer** as a new draft tape.

**Computer**

- An original beige desktop with a curved CRT (no real brand).
- **Show the editor on the screen with drei `<Html transform occlude>`,**
  rendering the existing `TuneEditor` component onto the monitor surface. It
  stays real DOM, so typing, text selection, screen readers and the clipboard
  all work. A CRT shader overlay (scanlines, glow, slight curve) goes on top.
- A boot screen ("SYNTHREEL OS v1.0, 640K OK") the first time you visit.
- Actions: *New tape* (blank template), *Open recording*, *Edit a shop tape*
  (opens a copy of any tape's code, which makes it a remix), *Play draft*,
  *Release*.

**Releasing your tape**

- *Release* opens a small label designer: title, artist name, emoji, colours
  and mood tags. The cassette insert updates live.
- The finished tape appears on the **Local Artists** shelf in the booth
  (custom tunes already persist in `localStorage`), and can be played at the
  counter like any other tape.
- **Tape duplicator:** "Dub a copy" exports the tape as WAV (existing export)
  and, later, "Share" creates a link that compresses the tune into the URL
  (`#tape=…`). Opening the link puts the tape in the visitor's window
  display, so sharing a tape means someone else's shop shows it off.

### 6. Shop atmosphere

- Rain on the window and a quiet street outside; occasional passing car
  lights. Rain gets heavier when a tape tagged `rain` is playing.
- Neon and LEDs pulse gently with the music level (the existing analyser).
- Day / night follows the existing light / dark theme: daytime has sunlight
  through the window, night has neon.
- Posters, shop signs, flyers and the shop's own brand are **original artwork
  only**: no copies of real album covers, record labels, shop chains, games
  or brands.
- Optional ambience: a soft hum from the lights, the door bell, cassette case
  clicks when you pick tapes up.
- **No real purchases.** The till on the counter is decoration (or opens the
  "about" panel). Nothing in the shop asks for payment or personal details.

## Accessibility and fallbacks (required)

- **The 2D deck stays.** It is the fallback when WebGL is unavailable, a
  low-power device is detected (`PerformanceMonitor` drops below target), or
  the user picks "Classic view". Save that choice per visitor.
- `prefers-reduced-motion`: skip the intro, shorten camera moves, turn off
  camera wobble and rain animation.
- Keyboard: Tab moves between areas and objects in order (counter controls →
  shelves → booth); existing shortcuts still work. Each interactive mesh has
  a matching off-screen DOM element for screen readers, and the live region
  in `App.jsx` keeps announcing what's playing.
- Browsing must not depend on 3D: an overlay list or search ("Find a tape")
  is always one click away.
- The existing e2e tests keep running against Classic view. Add a smoke test
  for the shop with stable test IDs on the overlay controls.

## Performance budget

| Target | Budget |
| --- | --- |
| Initial 3D download (models + textures, compressed) | ≤ 4 MB; booth detail loaded on first visit |
| Draw calls | ≤ 150 (instance all cassettes, merge static shelving) |
| Triangles | ≤ 350k |
| Frame rate | 60 fps on a mid-range laptop, ≥ 30 fps on a mid-range phone (device pixel ratio ≤ 1.5) |
| Time to inside the shop | < 3 s on a broadband connection after the click |

Techniques: baked lighting (no real-time shadows except a contact shadow
under the held tape), KTX2 textures, instancing for cassettes,
`frameloop="demand"` when nothing is moving (rain can run at a lower rate),
and lazy-loading the booth.

## Code structure

```text
src/
  scene/
    Shop.jsx              // Canvas, lighting, viewpoint camera rig, floor plan
    Storefront.jsx        // street, rain, neon sign, door / OPEN sign
    Shelves.jsx           // mood sections, instanced cassettes
    Bins.jsx              // new arrivals, bargain bin
    HeldTape.jsx          // pick-up / inspect / actions
    Counter.jsx           // listening deck, headphones, queue stack, hold basket
    InStoreRadio.jsx
    DemoBooth.jsx         // keyboard, computer, duplicator, Local Artists shelf
    Keyboard3D.jsx
    Computer3D.jsx        // CRT + <Html> TuneEditor
    LabelDesigner.jsx
    useViewpoints.js
    useCassetteTexture.js // runtime insert / spine textures
  audio/
    keyboardSynth.js      // small polyphonic Web Audio synth on the master bus
    scales.js             // parse manifest `key` into root + scale; snap to scale
    jamRecorder.js        // notes → Strudel pattern text, 4-track stack
    shopAcoustics.js      // speakers / headphones reverb send
  utils/
    shelving.js           // group tracks by mood, new arrivals, bargain seeds
public/models/shop.glb
```

`App.jsx` chooses between `<ClassicView/>` (today's layout) and
`<ShopView/>`. Both get the same `usePlayerState()` result. `useStrudel`
needs one small addition: expose the master input node (before the EQ) so
the keyboard synth and shop reverb go through the same EQ, master gain and
analysers.

Manifest additions (all optional, with fallbacks): `addedAt`, `staffPick`,
`keyboardPatch`, `artist` (for Local Artists tapes).

## Phases

| Phase | What ships | Rough effort |
| --- | --- | --- |
| 0. Prep | Fix track metadata (several `key` values don't match the code; see the review), expose master input node, `scales.js` and `shelving.js` with unit tests, new optional manifest fields | 2–3 days |
| 1. Greybox shop | R3F canvas with placeholder shapes for each area, viewpoint camera and floor plan, counter deck buttons and knobs wired to the transport, Classic/Shop toggle | 1 week |
| 2. Browsing | Instanced cassettes with runtime inserts, mood shelves, pick-up and inspect, Listen / Hold / Queue actions, load animation, reels and VU needles | 1–1.5 weeks |
| 3. Demo booth: keyboard | Synth and presets, QWERTY + touch + Web MIDI, scale lock, timing snap, booth deck for playing along | 1 week |
| 4. Demo booth: recording and release | Jam recorder, 4-track layering, CRT `<Html>` editor, label designer, Local Artists shelf, duplicator (WAV export) | 1.5 weeks |
| 5. Art pass | Final Blender models, baked lighting, neon and CRT shaders, rain, post effects | 2–3 weeks (most depends on art) |
| 6. Storefront and polish | Street intro, OPEN/CLOSED sign, in-store radio with positional DJ voice, headphones toggle, performance tuning, a11y pass, e2e smoke test | 1 week |
| 7. Extras | Share links into the window display, bargain-bin generative tapes, free-walk mode, a second deck for DJ mixing | open-ended |

Phases 1–4 deliver a fully usable shop with simple art; phase 5 is where it
starts to look good. Each phase can be merged on its own behind the
Classic/Shop toggle.

## Risks

- **Art takes the most time,** and a shop has more objects than a single
  room. Mitigation: begin with stylised low-poly models and flat colours
  (which also suits the 80s look); cassettes are one instanced model with
  generated textures, so the tape count doesn't add art work.
- **Mobile performance and battery,** especially rain and neon. Mitigation:
  performance budget above; `PerformanceMonitor` turns off rain and post
  effects first, then switches to Classic view.
- **Finding a specific tape in 3D is slower than a list.** Mitigation: the
  "Find a tape" overlay and the existing keyboard shortcuts.
- **Text in `<Html transform>` can look blurry** at some angles and zoom
  levels. Mitigation: the computer viewpoint looks straight at the screen;
  offer a "full screen editor" button that opens the 2D editor.
- **Keyboard latency** on some Android devices. Mitigation: own synth on the
  same `AudioContext`, `latencyHint: 'interactive'`, and a short note in the
  UI if the measured output latency is high.
- **Scale lock needs correct `key` metadata.** Mitigation: phase 0, plus a
  test that every manifest `key` parses.
- **Originality:** every model, poster, sign and brand in the shop must be
  original. No real deck, computer, keyboard, record label or shop-chain
  names, logos or exact likenesses.
