setcps(0.55)

stack(
  // glitchy percussion - broken beat pattern
  s("bd ~ ~ bd:3 ~ bd ~ ~, ~ ~ cp ~ ~ ~ cp:1 ~, hh:4 hh:2 hh:4 ~ hh:2 ~ hh:4 hh:2")
    .gain("0.2 0.2 0.2 0.16 0.2 0.2 0.2 0.2, 0.14 0.14 0.14 0.14 0.14 0.14 0.14 0.14, 0.06 0.04 0.06 0.04 0.06 0.04 0.06 0.04")
    .lpf(2800)
    .room(0.3)
    .size(0.4),

  // metallic lead - square wave with sharp filter
  note("e5 ~ b4 ~ ~ g4 ~ e5 ~ ~ d5 ~ ~ b4 g4 ~")
    .sound("square")
    .lpf(sine.range(800, 2400).slow(6))
    .lpq(4)
    .gain(0.07)
    .room(0.6)
    .delay(0.45)
    .delaytime(0.166)
    .delayfeedback(0.5),

  // sub bass - minimal root movement
  note("<e2 ~ ~ ~ ~ ~ ~ ~ d2 ~ ~ ~ ~ ~ ~ ~>")
    .sound("sawtooth")
    .lpf(200)
    .gain(0.2)
    .room(0.25),

  // pad stabs - dissonant cluster chords
  note("<[e3,g3,b3,d4] ~ ~ ~ [d3,f3,a3,c4] ~ ~ ~ ~ ~ [b2,e3,g3] ~ ~ ~ ~ ~>")
    .sound("sawtooth")
    .lpf(900)
    .lpq(1)
    .gain(0.08)
    .room(0.7)
    .size(0.8),

  // noise texture - filtered static
  s("~ ~ noise:2 ~ ~ noise:1 ~ ~")
    .gain(0.02)
    .lpf(sine.range(600, 1500).slow(8))
    .room(0.5)
    .size(0.6)
)
