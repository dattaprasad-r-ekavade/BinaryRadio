// 🌙 Moonlit Local v2 — an original SynthReel composition
// v2: v1's lead had 29 steps stretched over four bars, so it slid off the beat grid; it is now
// 8 eighths per bar, locked to the chords (Dm9 Bbmaj9 Gm9 Am7, D aeolian only). The bass adds a
// walk-up on the fourth bar, and the hats and lead come and go across a 32-bar form.
setcps(0.425)

stack(
  // breathing minor-nine chord bed
  note("<[d3,f3,a3,e4] [bb2,d3,f3,c4] [g2,bb2,d3,a3] [a2,c3,e3,g3]>")
    .sound("sawtooth")
    .lpf(sine.range(480, 1500).slow(12))
    .lpq(1.5)
    .gain(0.09)
    .room(0.82)
    .size(0.9),

  // raga-tinged lead on the eighth-note grid
  note("<[d5 ~ f5 e5 ~ d5 ~ a4] [c5 ~ d5 ~ ~ f5 ~ e5] [d5 ~ c5 a4 ~ ~ c5 d5] [~ a4 ~ ~ ~ ~ ~ ~]>")
    .sound("sine")
    .lpf(3000)
    .gain(0.13)
    .room(0.68)
    .size(0.78)
    .delay(0.34)
    .delaytime(0.441)
    .delayfeedback(0.3)
    .mask("<0!4 1!12 0!4 1!12>"),

  // bass on the roots; bar four walks up into the next D
  note("<[d2 ~ d2 ~] [bb1 ~ bb1 ~] [g1 ~ g1 ~] [a1 ~ b1 c2]>")
    .sound("triangle")
    .lpf(240)
    .gain(0.2)
    .room(0.22),

  // train-wheel pulse
  s("bd:2 ~ ~ ~ ~ ~ bd:1 ~ bd:2 ~ ~ ~ ~ ~ bd:1 ~")
    .gain(perlin.range(0.14, 0.2))
    .lpf(2300)
    .room(0.38),

  // backbeat and hats
  s("~ ~ ~ ~ cp:1 ~ ~ ~ ~ ~ ~ ~ cp:1 ~ ~ ~")
    .gain(0.085)
    .lpf(2300)
    .room(0.38)
    .mask("<0!2 1!30>"),

  s("~ ~ hh:2 ~ ~ ~ hh:1 ~ ~ ~ hh:2 ~ ~ ~ hh:3 ~")
    .gain(perlin.range(0.03, 0.05))
    .lpf(2600)
    .room(0.42)
    .mask("<0!8 1!24>"),

  // rail shimmer on the off-eighths
  s("~ ~ ~ hh:4 ~ ~ ~ hh:4 ~ ~ ~ hh:4 ~ ~ ~ hh:4")
    .gain(0.018)
    .lpf(sine.range(1800, 3600).slow(8))
    .room(0.55),

  // passing signal lights, four-bar phrase
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
