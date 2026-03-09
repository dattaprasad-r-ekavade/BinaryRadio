setcps(0.52)

stack(
  // heavy 4/4 kick with room
  s("bd:3 ~ ~ ~ bd:3 ~ ~ ~")
    .gain(0.24)
    .lpf(1200)
    .room(0.6)
    .size(0.75),

  // dub chord stabs - massive reverb
  note("<~ [d3,f3,a3] ~ ~ ~ ~ [c3,e3,g3] ~ ~ ~ ~ ~ ~ [a2,c3,e3] ~ ~>")
    .sound("sawtooth")
    .lpf(700)
    .lpq(2)
    .gain(0.1)
    .room(0.92)
    .size(0.95)
    .delay(0.6)
    .delaytime(0.375)
    .delayfeedback(0.55),

  // rumbling sub
  note("d2 ~ ~ ~ d2 ~ ~ ~ c2 ~ ~ ~ c2 ~ ~ ~")
    .sound("triangle")
    .lpf(180)
    .gain(0.22)
    .room(0.3),

  // mechanical hi-hats - offbeat emphasis
  s("~ hh:3 hh:1 ~ hh:3 ~ hh:1 hh:3")
    .gain("0.04 0.08 0.05 0.04 0.08 0.04 0.05 0.08")
    .lpf(sine.range(1200, 3500).slow(12))
    .room(0.7)
    .size(0.8),

  // clap on 2 and 4 - heavily reverbed
  s("~ ~ ~ ~ cp:1 ~ ~ ~")
    .gain(0.1)
    .room(0.88)
    .size(0.92)
    .delay(0.5)
    .delaytime(0.25)
    .delayfeedback(0.4)
    .lpf(2000),

  // distant siren - slow pitch sweep
  note("<~ ~ ~ ~ ~ ~ d5 ~ ~ ~ ~ ~ ~ ~ a4 ~>")
    .sound("sawtooth")
    .lpf(1800)
    .lpq(6)
    .gain(0.03)
    .room(0.95)
    .size(0.98)
    .delay(0.7)
    .delaytime(0.5)
    .delayfeedback(0.6)
    .slow(2)
)
