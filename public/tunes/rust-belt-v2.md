// 🏭 rust belt v2 — dub techno in an empty factory
// v2: the sub followed a different chord than the stabs (C under Dm); now both follow one
// 8-bar progression in D aeolian (Dm7 x3, C7, Dm7 x2, Bbmaj7, Am7). Four-on-the-floor kick,
// off-beat stabs into a dotted echo, and a 4-bar break every 32 bars.
setcps(0.4333)
stack(
  // kick, out for bars 17-20
  s("bd:3*4")
    .gain(0.24)
    .lpf(1200)
    .room(0.5)
    .size(0.6)
    .mask("<0!2 1!14 0!4 1!12>"),

  // dub chord stabs on the off-beats
  note("<[d3,f3,a3,c4]!3 [c3,e3,g3,bb3] [d3,f3,a3,c4]!2 [bb2,d3,f3,a3] [a2,c3,e3,g3]>")
    .struct("~ x ~ ~ ~ ~ ~ ~ ~ ~ x ~ ~ ~ ~ ~")
    .sound("sawtooth")
    .lpf(sine.range(500, 1100).slow(16))
    .lpq(2)
    .gain(0.1)
    .room(0.9)
    .size(0.95)
    .delay(0.6)
    .delaytime(0.433)
    .delayfeedback(0.55),

  // sub on the same roots
  note("<d2!3 c2 d2!2 bb1 a1>")
    .struct("x ~ ~ x ~ ~ x ~ ~ ~ x ~ ~ ~ ~ ~")
    .sound("triangle")
    .lpf(180)
    .gain(0.22)
    .room(0.2),

  // mechanical hats, off-beat lean, drifting level
  s("~ hh:3 hh:1 ~ hh:3 ~ hh:1 hh:3")
    .gain(perlin.range(0.04, 0.08))
    .lpf(sine.range(1200, 3500).slow(12))
    .room(0.7)
    .size(0.8)
    .mask("<0!2 1!30>"),

  // clap on 2 and 4, heavily reverbed
  s("~ ~ ~ ~ cp:1 ~ ~ ~ ~ ~ ~ ~ cp:1 ~ ~ ~")
    .gain(0.1)
    .room(0.88)
    .size(0.92)
    .delay(0.5)
    .delaytime(0.433)
    .delayfeedback(0.4)
    .lpf(2000)
    .mask("<0!4 1!12 0!4 1!12>"),

  // distant siren
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
    .slow(2),

  // factory air
  sound("brown")
    .attack(1)
    .release(1)
    .lpf(900)
    .gain(sine.range(0.01, 0.03).slow(10))
)
