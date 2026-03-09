// 🌧️ rain on glass — ambient meditation with rain textures
setcps(0.2)
stack(
  // slow drifting pad
  note("<[d3,f3,a3] [c3,e3,g3] [bb2,d3,f3] [a2,c3,e3]>")
    .sound("sine")
    .lpf(sine.range(400, 1400).slow(20))
    .gain(0.12)
    .room(0.95)
    .size(0.99)
    .slow(2),

  // glass harmonic overtones
  note("d5 ~ ~ f5 ~ ~ a5 ~ ~ e5 ~ ~ c5 ~ ~ g5")
    .sound("sine")
    .gain(0.07)
    .room(0.9)
    .size(0.95)
    .delay(0.7)
    .delaytime(0.5)
    .delayfeedback(0.55)
    .lpf(3500),

  // rain texture (white noise bursts)
  s("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~")
    .gain(0)
    .room(0.8),

  // sub bass breath
  note("d1 ~ ~ ~ c1 ~ ~ ~ bb0 ~ ~ ~ a1 ~ ~ ~")
    .sound("sine")
    .gain(0.18)
    .lpf(80)
    .room(0.5),

  // sparse metallic drops
  note("~ a4 ~ ~ ~ d5 ~ ~ ~ f4 ~ ~ ~ e5 ~ ~")
    .sound("metal")
    .gain(0.05)
    .room(0.99)
    .size(0.99)
    .delay(0.6)
    .delaytime(0.66)
    .delayfeedback(0.4),

  // soft shimmer
  note("<~ [a5,d6] ~ [f5,a5] ~ [e5,g5] ~ [c5,f5]>")
    .sound("sine")
    .gain(0.05)
    .room(0.98)
    .size(0.99)
    .lpf(5000)
    .slow(2)
)
