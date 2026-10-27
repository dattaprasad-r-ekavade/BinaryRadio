// 🏮 Lantern Procession — an original SynthReel composition
// A night procession through a temple courtyard, played by an imagined electric gamelan.
//
// What makes it different from the rest of the rack:
// - Tuning: slendro, five near-equal steps of ~240 cents. These pitches are not on a piano;
//   every note is a frequency, not a note name. Numbers below are gamelan cipher
//   (1 2 3 5 6), "+" an octave up, "-" an octave down.
// - Ombak ("waves"): each metal part has a twin tuned a few hertz sharp, so the pair beats
//   and shimmers, the way Balinese instruments are tuned in pairs.
// - Kotekan: the fast 16th-note figure is split between two players, polos (left) and
//   sangsih (right). Neither plays a tune alone; the melody exists only between the speakers.
// - Colotomic form: gong, kempul, kenong and kethuk mark fixed points of a 4-bar cycle
//   (the gongan) under a slow skeleton melody (balungan). Sudden one-bar stops (angsel) cut
//   the kotekan while the gongs carry on.
setcps(0.35)

// slendro on 1 = 277 Hz, steps slightly uneven like a real set
const SL = [277, 316.6, 364.3, 419.1, 480.9]
const DEG = { 1: 0, 2: 1, 3: 2, 5: 3, 6: 4 }
const idx = (t) => DEG[t[0]] + 5 * ((t.match(/\+/g) || []).length - (t.match(/-/g) || []).length)
const hzOf = (i, oct = 0, mul = 1) => (SL[((i % 5) + 5) % 5] * 2 ** (Math.floor(i / 5) + oct) * mul).toFixed(2)
const hz = (cipher, oct = 0, mul = 1) => cipher.replace(/[12356][+-]*/g, (t) => hzOf(idx(t), oct, mul))

// balungan: two gongan of four bars, two notes a bar; the gong falls on the last note (2, then low 6)
const BALUNGAN = '<[3 5] [6 5] [3 2] [1 2] [5 6] [5 3] [2 1] [2 6-]>'

// kotekan (norot style): each half bar alternates the previous tone with its upper neighbour,
// then lands on the new tone; even 16ths go to polos, odd 16ths to sangsih
const BAL = ['3', '5', '6', '5', '3', '2', '1', '2', '5', '6', '5', '3', '2', '1', '2', '6-'].map(idx)
const KOMB = BAL.flatMap((t, k) => {
  const p = BAL[(k + 15) % 16]
  return [p, p + 1, p, p + 1, t, t + 1, t, t]
})
const kotekan = (parity, mul) =>
  '<' +
  Array.from(
    { length: 8 },
    (_, b) =>
      '[' +
      KOMB.slice(b * 16, b * 16 + 16)
        .map((i, j) => (j % 2 === parity ? hzOf(i, 1, mul) : '~'))
        .join(' ') +
      ']',
  ).join(' ') +
  '>'

// kotekan in and out across 32 bars; the single silent bars are angsel breaks
const KOTEKAN_FORM = '<0!8 1!7 0 1!4 0!2 1!6 0!4>'

stack(
  // saron: the balungan on struck metal bars, with its sharp twin
  freq(hz(BALUNGAN))
    .sound("sine")
    .fm(1.6)
    .fmh(2.76)
    .attack(0.002)
    .decay(1.1)
    .sustain(0)
    .release(0.4)
    .gain(0.13)
    .pan(0.45)
    .room(0.45)
    .size(0.6),

  freq(hz(BALUNGAN, 0, 1.012))
    .sound("sine")
    .fm(1.6)
    .fmh(2.76)
    .attack(0.002)
    .decay(1.1)
    .sustain(0)
    .release(0.4)
    .gain(0.08)
    .pan(0.55)
    .room(0.45)
    .size(0.6),

  // kotekan polos (left)
  freq(kotekan(0, 1))
    .sound("sine")
    .fm(2.4)
    .fmh(3.5)
    .attack(0.001)
    .decay(0.32)
    .sustain(0)
    .gain(perlin.range(0.06, 0.085))
    .pan(0.2)
    .room(0.35)
    .mask(KOTEKAN_FORM),

  // kotekan sangsih (right), tuned sharp so the interlock shimmers
  freq(kotekan(1, 1.012))
    .sound("sine")
    .fm(2.4)
    .fmh(3.5)
    .attack(0.001)
    .decay(0.32)
    .sustain(0)
    .gain(perlin.range(0.06, 0.085))
    .pan(0.8)
    .room(0.35)
    .mask(KOTEKAN_FORM),

  // gong ageng on the last note of each gongan, a pair beating slowly
  freq(hz('<~ ~ ~ [~ 2] ~ ~ ~ [~ 6-]>', -2))
    .sound("sine")
    .fm(0.7)
    .fmh(1.41)
    .attack(0.01)
    .decay(3)
    .sustain(0.25)
    .release(4)
    .gain(0.24)
    .room(0.6)
    .size(0.8),

  freq(hz('<~ ~ ~ [~ 2] ~ ~ ~ [~ 6-]>', -2, 1.02))
    .sound("sine")
    .attack(0.05)
    .decay(3)
    .sustain(0.2)
    .release(4)
    .gain(0.12),

  // kempul halfway through each gongan
  freq(hz('<~ [~ 5] ~ ~ ~ [~ 3] ~ ~>', -1))
    .sound("sine")
    .fm(0.9)
    .fmh(1.5)
    .decay(1.8)
    .sustain(0.1)
    .release(1.5)
    .gain(0.12)
    .room(0.5),

  // kenong on every bar's landing note
  freq(hz('<[~ 5] [~ 5] [~ 2] [~ 2] [~ 6] [~ 3] [~ 1] [~ 6-]>', -1, 2))
    .sound("sine")
    .fm(0.5)
    .fmh(2)
    .decay(1.4)
    .sustain(0.05)
    .release(1)
    .gain(0.06)
    .pan(0.6)
    .room(0.5),

  // kethuk: a dry tick between the kenong strokes
  s("[~ rim:1] ~")
    .gain(0.05)
    .lpf(2500)
    .room(0.3),

  // kendang: the drummer who leads, from bar 5
  s("<[~ ~ lt ~ ~ mt ~ lt ~ ~ lt ~ mt ~ rim ~] [lt ~ ~ mt ~ ~ lt ~ ~ mt ~ lt ~ ~ rim ~]>")
    .gain(perlin.range(0.08, 0.13))
    .lpf(3000)
    .room(0.35)
    .mask("<0!4 1!28>"),

  // suling: a bamboo flute floating over the cycle, bars 17-28
  freq(hz('<[~ ~ ~ ~ 6 ~ ~ ~] [1+ ~ ~ 2+ ~ ~ 1+ ~] [6 ~ ~ ~ ~ ~ 5 ~] [~ ~ 3 ~ 5 ~ ~ ~] [~ ~ ~ ~ 2+ ~ ~ ~] [3+ ~ ~ 2+ ~ ~ 1+ ~] [6 ~ ~ ~ 5 ~ 6 ~] [~ ~ ~ ~ ~ ~ ~ ~]>', 1))
    .sound("sine")
    .attack(0.12)
    .release(0.9)
    .vib(4.5)
    .vibmod(0.12)
    .lpf(3500)
    .gain(0.09)
    .room(0.6)
    .size(0.75)
    .delay(0.3)
    .delaytime(0.536)
    .delayfeedback(0.3)
    .mask("<0!16 1!12 0!4>"),

  // night air: a low slendro drone on 1 and 5, with its twin
  freq(hz('[1,5]', -1))
    .sound("sine")
    .attack(2)
    .release(2)
    .lpf(900)
    .gain(0.035),

  freq(hz('[1,5]', -1, 1.008))
    .sound("triangle")
    .attack(2)
    .release(2)
    .lpf(700)
    .gain(0.025)
)
