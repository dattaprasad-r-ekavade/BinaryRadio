// ☀️ solar wind — cosmic ambient explorations
setcps(0.25)
stack(
  // golden shimmer pad
  note("<[e3,g#3,b3] [d3,f#3,a3] [c#3,e3,g#3] [a2,c#3,e3]>")
    .sound("sawtooth")
    .lpf(sine.range(800, 3000).slow(16))
    .lpq(1.5)
    .gain(0.11)
    .room(0.9)
    .size(0.95),

  // rising solar tones
  note("e4 ~ b4 ~ g#4 ~ ~ b4 d4 ~ a4 ~ f#4 ~ ~ e4")
    .sound("sine")
    .gain(0.13)
    .room(0.85)
    .size(0.9)
    .delay(0.5)
    .delaytime(0.3)
    .delayfeedback(0.45)
    .lpf(4000),

  // cosmic bass pulse
  note("e2 ~ ~ ~ a2 ~ ~ ~ d2 ~ ~ ~ c#2 ~ ~ ~")
    .sound("triangle")
    .lpf(500)
    .gain(0.2)
    .room(0.5)
    .size(0.6),

  // orbital rhythmic accents
  s("~ ~ ~ hh:2 ~ ~ ~ hh:1 ~ ~ ~ hh:3 ~ ~ ~ hh")
    .gain(0.07)
    .room(0.7)
    .size(0.8)
    .lpf(5000),

  // stardust texture
  note("~ ~ b5 ~ ~ ~ ~ e6 ~ ~ g#5 ~ ~ ~ ~ b5")
    .sound("sine")
    .gain(0.05)
    .room(0.99)
    .size(0.99)
    .delay(0.8)
    .delaytime(0.66)
    .delayfeedback(0.55)
    .lpf(6000),

  // solar flare brass-ish swell
  note("<~ [e4,g#4,b4] ~ ~ ~ [d4,f#4,a4] ~ ~>")
    .sound("sawtooth")
    .lpf(2000)
    .gain(0.07)
    .room(0.8)
    .size(0.9)
    .slow(2)
)
