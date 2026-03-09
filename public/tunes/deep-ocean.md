// 🐋 deep ocean — abyssal ambient depths
setcps(0.15)
stack(
  // vast low rumble
  note("<c1 bb0 ab0 eb1>")
    .sound("sine")
    .lpf(120)
    .gain(0.22)
    .room(0.99)
    .size(0.99)
    .slow(4),

  // whale-song harmonics
  note("c4 ~ ~ ~ g3 ~ ~ ~ eb4 ~ ~ ~ bb3 ~ ~ ~")
    .sound("sine")
    .lpf(sine.range(300, 1800).slow(30))
    .gain(0.09)
    .room(0.99)
    .size(0.99)
    .delay(0.8)
    .delaytime(0.75)
    .delayfeedback(0.6)
    .slow(2),

  // deep mid-layer
  note("<[c2,eb2,g2] ~ [bb1,d2,f2] ~ [ab1,c2,eb2] ~ [eb2,g2,bb2] ~>")
    .sound("sine")
    .lpf(800)
    .gain(0.1)
    .room(0.97)
    .size(0.99)
    .slow(2),

  // distant sonar pings
  note("~ ~ ~ c5 ~ ~ ~ ~ ~ ~ ~ g4 ~ ~ ~ ~")
    .sound("sine")
    .gain(0.06)
    .room(0.99)
    .size(0.99)
    .delay(0.9)
    .delaytime(1.0)
    .delayfeedback(0.65)
    .lpf(3000),

  // bioluminescent shimmer
  note("~ eb5 ~ ~ ~ g4 ~ ~ ~ c5 ~ ~ ~ ab4 ~ ~")
    .sound("sine")
    .gain(0.04)
    .room(0.99)
    .size(0.99)
    .lpf(5000)
    .delay(0.7)
    .delaytime(0.5)
    .delayfeedback(0.5)
)
