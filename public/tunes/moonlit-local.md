// Moonlit Local — an original SynthReel composition
// A late-night train rhythm dissolving into a warm electronic raga.
setcps(0.425)

stack(
  // Slowly breathing minor-nine chord bed
  note("<[d3,f3,a3,e4] [bb2,d3,f3,c4] [g2,bb2,d3,a3] [a2,c3,e3,g3]>")
    .sound("sawtooth")
    .lpf(sine.range(480, 1500).slow(12))
    .lpq(1.5)
    .gain(0.09)
    .room(0.82)
    .size(0.9),

  // Raga-tinged lead: patient phrases with room between them
  note("d5 ~ f5 e5 ~ d5 ~ a4 c5 ~ d5 ~ ~ f5 ~ e5 d5 ~ c5 a4 ~ ~ c5 d5 ~ a4 ~ ~ ~")
    .sound("sine")
    .lpf(3000)
    .gain(0.12)
    .room(0.68)
    .size(0.78)
    .delay(0.42)
    .delaytime(0.375)
    .delayfeedback(0.38)
    .slow(1.5),

  // Rolling bass follows the lights between stations
  note("d2 ~ d2 ~ bb1 ~ ~ c2 g1 ~ g1 ~ a1 ~ c2 ~")
    .sound("triangle")
    .lpf(240)
    .gain(0.2)
    .room(0.22),

  // Soft train-wheel pulse and a clap at each turn
  s("bd:2 ~ ~ hh:2 bd:1 ~ hh:1 ~ bd:2 ~ ~ hh:3 ~ ~ cp:1 ~")
    .gain("0.2 0 0 0.045 0.13 0 0.035 0 0.18 0 0 0.05 0 0 0.09 0")
    .lpf(2300)
    .room(0.38),

  // A quiet metallic counter-rhythm, like rails under the carriage
  s("~ shaker:1 ~ ~ shaker ~ ~ shaker:1")
    .gain(0.035)
    .lpf(sine.range(1500, 3600).slow(8))
    .room(0.55),

  // Passing signal lights above the mix
  note("<~ a5 ~ ~ ~ ~ d6 ~ ~ ~ c6 ~ ~ ~ e6 ~>")
    .sound("square")
    .lpf(4200)
    .gain(0.025)
    .room(0.92)
    .size(0.96)
    .delay(0.7)
    .delaytime(0.5)
    .delayfeedback(0.58)
    .slow(2)
)
