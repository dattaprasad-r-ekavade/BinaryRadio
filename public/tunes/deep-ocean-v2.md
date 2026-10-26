// 🐋 deep ocean v2 — abyssal ambient depths
// v2: the rumble moved up an octave (was 26-39 Hz, below most speakers), the sub is drier
// so it stops smearing, the whale line is a three-bar phrase over a sixteen-bar harmony
// (C aeolian only), and the pings fall at random instead of on the same steps.
setcps(0.3)
stack(
  // low rumble, four bars per root: C Bb Ab Eb
  note("<c2 bb1 ab1 eb2>")
    .sound("sine")
    .lpf(200)
    .gain(0.15)
    .room(0.3)
    .slow(4),

  // whale song: three-bar phrase, the third bar silent
  note("<[c4 ~ ~ ~ ~ ~ eb4 ~ ~ ~ ~ ~ ~ ~ ~ ~] [~ ~ ~ ~ g3 ~ ~ ~ ~ ~ bb3 ~ ~ ~ ~ ~] [~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~]>")
    .sound("sine")
    .lpf(sine.range(300, 1800).slow(30))
    .gain(0.12)
    .room(0.95)
    .size(0.98)
    .delay(0.7)
    .delaytime(0.75)
    .delayfeedback(0.55),

  // deep mid-layer, sounding two bars of every four
  note("<[c2,eb2,g2] ~ [bb1,d2,f2] ~ [ab1,c2,eb2] ~ [eb2,g2,bb2] ~>")
    .sound("sine")
    .lpf(800)
    .gain(0.08)
    .room(0.95)
    .size(0.98)
    .slow(2),

  // distant sonar pings, random gaps
  note("~ ~ ~ c5 ~ ~ ~ ~ ~ ~ ~ g4 ~ ~ ~ ~")
    .sound("sine")
    .degradeBy(0.4)
    .gain(0.06)
    .room(0.98)
    .size(0.99)
    .delay(0.8)
    .delaytime(1.0)
    .delayfeedback(0.6)
    .lpf(3000),

  // bioluminescent shimmer, enters after eight bars
  note("~ eb5 ~ ~ ~ g4 ~ ~ ~ c5 ~ ~ ~ ab4 ~ ~")
    .sound("sine")
    .degradeBy(0.25)
    .gain(0.04)
    .room(0.98)
    .size(0.99)
    .lpf(5000)
    .delay(0.7)
    .delaytime(0.5)
    .delayfeedback(0.5)
    .mask("<0!8 1!24>"),

  // water: brown noise that breathes
  sound("brown")
    .attack(1)
    .release(1)
    .lpf(500)
    .gain(sine.range(0.02, 0.05).slow(11))
)
