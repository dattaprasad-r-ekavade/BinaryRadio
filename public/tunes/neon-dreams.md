// 🕹️ neon dreams — chiptune lofi beats
setcps(0.4)
stack(
  // chiptune lead melody (pulse wave feel)
  note("c5 ~ e5 g5 ~ e5 d5 ~ c5 ~ e5 a5 ~ g5 ~ e5")
    .sound("square")
    .lpf(4000)
    .gain(0.14)
    .room(0.3)
    .size(0.4)
    .delay(0.3)
    .delaytime(0.25)
    .delayfeedback(0.3),

  // arpy 8-bit chords
  note("<[c4,e4,g4] [a3,c4,e4] [f3,a3,c4] [g3,b3,d4]>")
    .sound("square")
    .lpf(2500)
    .gain(0.09)
    .room(0.4)
    .size(0.5),

  // hip hop style kick/snare
  s("bd ~ ~ ~ bd bd ~ ~ ~ ~ bd ~ bd ~ ~ ~")
    .gain(0.3)
    .distort(0.1)
    .room(0.3),

  s("~ ~ cp ~ ~ ~ cp ~ ~ ~ ~ cp ~ ~ cp ~")
    .gain(0.2)
    .room(0.3),

  // 8-bit bass
  note("c2 ~ c2 ~ a1 ~ a1 ~ f1 ~ f1 ~ g1 ~ g1 ~")
    .sound("square")
    .lpf(600)
    .gain(0.22)
    .room(0.2),

  // chiptune hi-hats
  s("~ hh ~ hh ~ hh ~ hh ~ hh ~ hh ~ hh ~ hh")
    .gain(0.08)
    .speed(2)
    .room(0.2),

  // vinyl crackle vibe
  s("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~")
    .gain(0)
)
