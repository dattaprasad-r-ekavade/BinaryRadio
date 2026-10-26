// 🕹️ neon dreams v2 — chiptune lofi beats
// v2: bass now changes with the chords (one per bar: Cmaj7 Am7 Fmaj7 G7), the hook keeps its
// opening and varies its ending each bar, swung hats, real vinyl crackle instead of a silent layer.
setcps(0.4667)
stack(
  // chiptune lead: same opening each bar, different answer
  note("<[c5 ~ e5 g5 ~ e5 d5 ~ ~ ~ c5 ~ ~ ~ ~ ~] [~ ~ e5 g5 ~ e5 d5 ~ ~ ~ a4 ~ c5 ~ ~ ~] [c5 ~ e5 a5 ~ g5 e5 ~ ~ ~ f5 ~ e5 ~ ~ ~] [d5 ~ ~ b4 ~ ~ d5 ~ g5 ~ ~ ~ f5 ~ ~ ~]>")
    .sound("square")
    .lpf(3200)
    .gain(0.13)
    .room(0.3)
    .size(0.4)
    .delay(0.3)
    .delaytime(0.402)
    .delayfeedback(0.3)
    .mask("<0!4 1!24 0!4>"),

  // 8-bit chords with sevenths
  note("<[c4,e4,g4,b4] [a3,c4,e4,g4] [f3,a3,c4,e4] [g3,b3,d4,f4]>")
    .sound("square")
    .lpf(2200)
    .gain(0.08)
    .room(0.4)
    .size(0.5),

  // hip hop kick / clap
  s("bd ~ ~ ~ ~ ~ ~ bd ~ ~ bd ~ ~ ~ ~ ~")
    .gain(0.3)
    .distort(0.1)
    .room(0.3),

  s("~ ~ ~ ~ cp ~ ~ ~ ~ ~ ~ ~ cp ~ ~ ~")
    .gain(0.2)
    .room(0.3),

  // 8-bit bass on the chord root
  note("<c2 a1 f1 g1>")
    .struct("x ~ ~ x ~ ~ x ~ ~ ~ x ~ x ~ ~ ~")
    .sound("square")
    .lpf(600)
    .gain(0.2)
    .room(0.2),

  // swung hats with drifting level
  s("[hh:1 hh]*4")
    .gain(perlin.range(0.05, 0.09))
    .speed(2)
    .room(0.2)
    .swingBy(1 / 6, 4),

  // vinyl crackle
  sound("crackle")
    .density(0.04)
    .gain(0.08)
    .hpf(1200)
)
