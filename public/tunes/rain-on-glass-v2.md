// 🌧️ rain on glass v2 — ambient meditation with real rain
// v2: the silent rain layer is now pink noise plus random droplets; the sub moved up an octave
// so laptops can hear it, and plays a fixed walk that recolours each pad chord (D aeolian only);
// the glass melody is narrower and breathes.
setcps(0.3167)
stack(
  // slow drifting pad, two bars per chord: Dm C Bb Am
  note("<[d3,f3,a3] [c3,e3,g3] [bb2,d3,f3] [a2,c3,e3]>")
    .sound("sine")
    .lpf(sine.range(400, 1400).slow(20))
    .gain(0.12)
    .room(0.9)
    .size(0.95)
    .slow(2),

  // bass walk, same every bar: Dm7, Dm/F, Dm/A ... C/D, Fmaj9, Am7 ... Bbmaj7 ...
  note("d2 ~ ~ f2 ~ ~ ~ a1 ~ ~ c2 ~ ~ ~ bb1 ~")
    .sound("triangle")
    .lpf(300)
    .gain(0.17)
    .room(0.4),

  // glass melody: two-bar phrase over four-bar harmony, so it meets each chord differently
  note("<[~ ~ a4 ~ ~ c5 ~ d5 ~ ~ ~ ~ c5 ~ a4 ~] [~ ~ g4 ~ ~ a4 ~ f4 ~ ~ e4 ~ ~ ~ ~ ~]>")
    .sound("sine")
    .gain(0.11)
    .room(0.85)
    .size(0.9)
    .delay(0.6)
    .delaytime(0.5)
    .delayfeedback(0.5)
    .lpf(3500)
    .mask("<0!4 1!12 0!4 1!12>"),

  // rain wash: pink noise that swells slowly like gusts
  sound("pink")
    .attack(0.5)
    .release(0.5)
    .hpf(1500)
    .lpf(7000)
    .gain(sine.range(0.015, 0.04).slow(14))
    .pan(sine.range(0.35, 0.65).slow(9)),

  // droplets on the glass: random, never the same bar twice
  s("hh:4*16")
    .degradeBy(0.65)
    .gain(rand.range(0.01, 0.035))
    .speed(rand.range(1.4, 2.2))
    .hpf(3000)
    .pan(rand)
    .room(0.6),

  // sparse high drops
  note("~ a4 ~ ~ ~ d5 ~ ~ ~ f4 ~ ~ ~ e5 ~ ~")
    .sound("triangle")
    .decay(0.3)
    .sustain(0)
    .gain(0.05)
    .degradeBy(0.3)
    .room(0.95)
    .size(0.95)
    .delay(0.6)
    .delaytime(0.66)
    .delayfeedback(0.4),

  // soft shimmer
  note("<~ [a5,d6] ~ [f5,a5] ~ [e5,g5] ~ [c5,f5]>")
    .sound("sine")
    .gain(0.045)
    .room(0.98)
    .size(0.99)
    .lpf(5000)
    .slow(2)
)
