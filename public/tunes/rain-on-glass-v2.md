// 🌧️ rain on glass v2 — ambient meditation with real rain
// v2: the silent rain layer is now pink noise; the sub moved up an octave so laptops can hear
// it, and plays a fixed walk that recolours each pad chord (D aeolian only); the glass melody
// is narrower and breathes.
// v2.1 (review: "some beats are overlapping"): v2 also had random hi-hat droplets and echoes at
// 0.5 and 0.66 s against a 0.789 s beat, which read as stumbling percussion. The droplets are
// gone (the pink noise carries the rain), the high drops are fixed instead of random, and every
// echo is locked to the beat.
setcps(0.3167)
stack(
  // slow drifting pad, two bars per chord: Dm C Bb Am
  note("<[d3,f3,a3] [c3,e3,g3] [bb2,d3,f3] [a2,c3,e3]>")
    .sound("sine")
    .attack(0.6)
    .release(1.5)
    .lpf(sine.range(400, 1400).slow(20))
    .gain(0.12)
    .room(0.85)
    .size(0.9)
    .slow(2),

  // bass walk, same every bar: Dm7, Dm/F, Dm/A ... C/D, Fmaj9, Am7 ... Bbmaj7 ...
  note("d2 ~ ~ f2 ~ ~ ~ a1 ~ ~ c2 ~ ~ ~ bb1 ~")
    .sound("triangle")
    .lpf(300)
    .gain(0.17)
    .room(0.4),

  // glass melody: two-bar phrase over four-bar harmony; echo a dotted eighth later
  note("<[~ ~ a4 ~ ~ c5 ~ d5 ~ ~ ~ ~ c5 ~ a4 ~] [~ ~ g4 ~ ~ a4 ~ f4 ~ ~ e4 ~ ~ ~ ~ ~]>")
    .sound("sine")
    .gain(0.11)
    .room(0.8)
    .size(0.85)
    .delay(0.35)
    .delaytime(0.592)
    .delayfeedback(0.3)
    .lpf(3500)
    .mask("<0!4 1!12 0!4 1!12>"),

  // rain wash: pink noise that swells slowly like gusts
  sound("pink")
    .attack(0.5)
    .release(0.5)
    .hpf(1500)
    .lpf(7000)
    .gain(sine.range(0.02, 0.045).slow(14))
    .pan(sine.range(0.35, 0.65).slow(9)),

  // high drops: two per four bars, on the beat, echo one beat later
  note("<[~ ~ ~ ~ a4 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~] [~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~] [~ ~ ~ ~ ~ ~ ~ ~ d5 ~ ~ ~ ~ ~ ~ ~] [~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~]>")
    .sound("triangle")
    .decay(0.3)
    .sustain(0)
    .gain(0.05)
    .room(0.9)
    .size(0.9)
    .delay(0.3)
    .delaytime(0.789)
    .delayfeedback(0.25),

  // soft shimmer
  note("<~ [a5,d6] ~ [f5,a5] ~ [e5,g5] ~ [c5,f5]>")
    .sound("sine")
    .attack(0.5)
    .gain(0.045)
    .room(0.9)
    .size(0.95)
    .lpf(5000)
    .slow(2)
)
