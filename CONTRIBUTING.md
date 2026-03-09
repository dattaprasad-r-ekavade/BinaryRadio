# Contributing a new tape 🎵

Anyone can add new generative music tracks! Here's how.

---

## 1. Write the tune

Create a new file in `public/tunes/your-track-name.md`.

The file contains plain [Strudel](https://strudel.cc) pattern code.
**Do not** include a `setcps(...)` line — tempo is controlled by the deck slider.

**Template** (`public/tunes/your-track-name.md`):

```javascript
// 🎸 Your Track Name — short vibe description
stack(
  // layer 1 — pad / chords
  note("<[c3,e3,g3] [a2,c3,e3]>")
    .sound("sawtooth")
    .lpf(1200)
    .gain(0.12)
    .room(0.8),

  // layer 2 — melody
  note("c4 e4 g4 a4 ~ g4 e4 ~")
    .sound("sine")
    .gain(0.15)
    .room(0.6)
    .delay(0.4)
    .delaytime(0.25),

  // layer 3 — bass
  note("c2 ~ ~ ~ a1 ~ ~ ~")
    .sound("triangle")
    .lpf(400)
    .gain(0.2),

  // layer 4 — rhythm
  s("bd ~ cp ~ bd ~ cp ~")
    .gain(0.25)
)
```

You can prototype your pattern at https://strudel.cc before adding it here.

---

## 2. Register the track

Open `src/data/tracks.js` and add an entry to the `tracks` array:

```js
{
  id: 'your-track-name',          // must match filename (without .md)
  title: 'Your Track Name',
  file: '/tunes/your-track-name.md',
  color: '#1b3a20',               // cassette body colour (dark shade works best)
  accent: '#44ee88',              // glow / highlight colour
  emoji: '🎸',                    // shown on the cassette
  description: 'Short vibe line', // 3–6 words
},
```

---

## 3. Test it

```bash
npm run dev
```

Open http://localhost:5173, find your tape in the rack, click it, press ▶. Tune the tempo slider until it sounds right to you and note the CPS value — add it as a comment in your `.md` file for future reference.

---

## 4. Open a Pull Request

- Commit both `public/tunes/your-track-name.md` and the updated `src/data/tracks.js`
- PR title: `Add tape: Your Track Name`
- Include the intended CPS value and a one-line description of the vibe

---

## Strudel quick-reference

| Concept | Example |
|---------|---------|
| Notes | `note("c4 e4 g4")` |
| Chords | `note("[c3,e3,g3]")` |
| Samples | `s("bd cp hh")` |
| Slow/fast | `.slow(2)` / `.fast(2)` |
| LPF | `.lpf(800)` |
| Reverb | `.room(0.8).size(0.9)` |
| Delay | `.delay(0.5).delaytime(0.25).delayfeedback(0.4)` |
| Gain | `.gain(0.15)` |
| Sine wave LFO | `sine.range(400, 1600).slow(10)` |

Full docs: https://strudel.cc/learn
