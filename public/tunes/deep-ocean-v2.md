// 🐋 deep ocean v2 — abyssal ambient depths
// v2: the rumble moved up an octave (was 26-39 Hz, below most speakers), the sub is drier
// so it stops smearing, and the whale line is a three-bar phrase over a sixteen-bar harmony
// (C aeolian only).
// v2.1 (review: "overlapping beats make it hard to listen"): v2 ran three echo trains at
// 0.5, 0.75 and 1.0 s against a 0.833 s beat, with high feedback and random pings, so echoes
// landed between beats and piled up. Every echo is now locked to the beat (1, 1.5 or 2 beats),
// feedback is lower, the pings are fixed instead of random, and the reverbs are shorter.
setcps(0.3)
stack(
  // low rumble, four bars per root: C Bb Ab Eb
  note("<c2 bb1 ab1 eb2>")
    .sound("sine")
    .lpf(200)
    .gain(0.15)
    .room(0.3)
    .slow(4),

  // whale song: three-bar phrase, the third bar silent; echo one beat later
  note("<[c4 ~ ~ ~ ~ ~ eb4 ~ ~ ~ ~ ~ ~ ~ ~ ~] [~ ~ ~ ~ g3 ~ ~ ~ ~ ~ bb3 ~ ~ ~ ~ ~] [~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~]>")
    .sound("sine")
    .attack(0.15)
    .release(1.2)
    .lpf(sine.range(300, 1800).slow(30))
    .gain(0.12)
    .room(0.85)
    .size(0.9)
    .delay(0.35)
    .delaytime(0.833)
    .delayfeedback(0.3),

  // deep mid-layer, sounding two bars of every four
  note("<[c2,eb2,g2] ~ [bb1,d2,f2] ~ [ab1,c2,eb2] ~ [eb2,g2,bb2] ~>")
    .sound("sine")
    .attack(0.8)
    .release(1.5)
    .lpf(800)
    .gain(0.08)
    .room(0.85)
    .size(0.9)
    .slow(2),

  // distant sonar: one ping every two bars, echo two beats later
  note("<[~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ c5 ~ ~ ~] [~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~] [~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ g4 ~ ~ ~] [~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~]>")
    .sound("sine")
    .gain(0.05)
    .room(0.9)
    .size(0.95)
    .delay(0.4)
    .delaytime(1.667)
    .delayfeedback(0.35)
    .lpf(3000),

  // bioluminescent shimmer on the beat, after eight bars; echo a beat and a half later
  note("<[eb5 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~] [~ ~ ~ ~ ~ ~ ~ ~ g4 ~ ~ ~ ~ ~ ~ ~] [~ ~ ~ ~ c5 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~] [~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ab4 ~ ~ ~]>")
    .sound("sine")
    .gain(0.035)
    .room(0.9)
    .size(0.95)
    .lpf(5000)
    .delay(0.3)
    .delaytime(1.25)
    .delayfeedback(0.25)
    .mask("<0!8 1!24>"),

  // water: brown noise that breathes
  sound("brown")
    .attack(1)
    .release(1)
    .lpf(500)
    .gain(sine.range(0.02, 0.05).slow(11))
)
