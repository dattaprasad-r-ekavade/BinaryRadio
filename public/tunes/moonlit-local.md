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

  // Raga-tinged lead: one 32-step phrase across the four-chord form
  note("d5 ~ f5 e5 ~ d5 ~ a4 c5 ~ d5 ~ ~ f5 ~ e5 d5 ~ c5 a4 ~ ~ c5 d5 ~ a4 ~ ~ ~")
    .sound("sine")
    .lpf(3000)
    .gain(0.12)
    .room(0.68)
    .size(0.78)
    .delay(0.34)
    .delaytime(0.294)
    .delayfeedback(0.3)
    .slow(4),

  // Bass changes only with the chord roots: D, Bb, G, A
  note("<[d2 ~ d2 ~] [bb1 ~ bb1 ~] [g1 ~ g1 ~] [a1 ~ a1 ~]>")
    .sound("triangle")
    .lpf(240)
    .gain(0.2)
    .room(0.22),

  // A single, unambiguous four-beat train-wheel pulse
  s("bd:2 ~ ~ ~ ~ ~ bd:1 ~ bd:2 ~ ~ ~ ~ ~ bd:1 ~")
    .gain("0.2 0 0 0 0 0 0.12 0 0.18 0 0 0 0 0 0.12 0")
    .lpf(2300)
    .room(0.38),

  // Backbeat and eighth-note hats share the same 16-step grid
  s("~ ~ ~ ~ cp:1 ~ ~ ~ ~ ~ ~ ~ cp:1 ~ ~ ~")
    .gain(0.085)
    .lpf(2300)
    .room(0.38),

  s("~ ~ hh:2 ~ ~ ~ hh:1 ~ ~ ~ hh:2 ~ ~ ~ hh:3 ~")
    .gain(0.04)
    .lpf(2600)
    .room(0.42),

  // Quiet rail shimmer on the off-eighths, never a competing pulse
  s("~ ~ ~ hh:4 ~ ~ ~ hh:4 ~ ~ ~ hh:4 ~ ~ ~ hh:4")
    .gain(0.018)
    .lpf(sine.range(1800, 3600).slow(8))
    .room(0.55),

  // Passing signal lights resolve with the same four-cycle phrase
  note("~ ~ ~ ~ ~ ~ a5 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ d6 ~ ~ ~ ~ ~ ~ ~ ~ c6 ~ ~ e6 ~")
    .sound("square")
    .lpf(4200)
    .gain(0.025)
    .room(0.92)
    .size(0.96)
    .delay(0.7)
    .delaytime(0.588)
    .delayfeedback(0.48)
    .slow(4)
)
