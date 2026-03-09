// 🌊 gentle focus — paste into strudel.cc and press ctrl+enter
setcps(0.25)
stack(
  // airy pad — lighter voicing, more motion
  note("<[e3,g3,b3] [c3,e3,a3] [d3,f3,a3] [g3,b3,d4]>")
    .sound("sawtooth")
    .lpf(sine.range(600, 1800).slow(12))
    .lpq(1)
    .gain(0.15)
    .room(0.7)
    .size(0.8),

  // melody — more notes, gentle rhythm
  note("e4 ~ g4 b4 ~ a4 ~ g4 e4 ~ d4 ~ e4 g4 a4 ~")
    .sound("sine")
    .gain(0.18)
    .room(0.8)
    .size(0.85)
    .delay(0.5)
    .delaytime(0.25)
    .delayfeedback(0.4)
    .lpf(2500),

  // bass — rounder, more rhythmic
  note("c2 ~ e2 ~ a1 ~ ~ d2 ~ g1 ~ ~ f1 ~ g1 ~")
    .sound("triangle")
    .lpf(400)
    .gain(0.2)
    .room(0.4),

  // soft percussion — lofi feel
  s("hh:2 ~ hh hh:1 ~ hh:3 ~ hh")
    .gain(0.12)
    .lpf(2500)
    .room(0.6)
    .size(0.7),

  // shaker texture
  s("~ shaker ~ shaker:1 ~ ~ shaker:2 ~")
    .gain(0.07)
    .lpf(3000)
    .room(0.5)
    .fast(2),

  // high chimes — more frequent, sparkly
  note("<~ e5 ~ b5 g5 ~ a5 ~>")
    .sound("sine")
    .gain(0.08)
    .room(0.9)
    .size(0.9)
    .delay(0.6)
    .delaytime(0.33)
    .delayfeedback(0.5)
    .lpf(4000)

)