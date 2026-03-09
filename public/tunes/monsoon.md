setcps(0.38)

stack(
  // tanpura drone - sa and pa
  note("[c3,g3]")
    .sound("triangle")
    .lpf(sine.range(300, 800).slow(20))
    .gain(0.12)
    .room(0.8)
    .size(0.9),

  // raga melody - bhairav-inspired (with komal re and dha)
  note("c4 ~ db4 ~ e4 ~ ~ g4 ~ ~ a4 ~ ~ ab4 ~ g4 ~ ~ e4 ~ ~ db4 ~ c4 ~ ~ ~ ~ ~ ~ ~ ~")
    .sound("sine")
    .gain(0.13)
    .room(0.75)
    .size(0.8)
    .delay(0.4)
    .delaytime(0.33)
    .delayfeedback(0.35)
    .lpf(2800)
    .slow(2),

  // deep sa drone
  note("c2")
    .sound("sawtooth")
    .lpf(160)
    .gain(0.14)
    .room(0.6),

  // tabla-ish rhythm - light and sparse
  s("bd:1 ~ ~ ~ ~ hh:2 ~ ~ bd:1 ~ hh:3 ~ ~ ~ ~ ~")
    .gain("0.12 0 0 0 0 0.05 0 0 0.1 0 0.04 0 0 0 0 0")
    .lpf(1800)
    .room(0.5)
    .slow(1.5),

  // high overtones - sitar-like harmonics
  note("<~ ~ ~ e6 ~ ~ ~ ~ ~ ~ c6 ~ ~ ~ ~ ~ ~ ~ g5 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~>")
    .sound("sine")
    .gain(0.04)
    .room(0.9)
    .size(0.95)
    .delay(0.65)
    .delaytime(0.45)
    .delayfeedback(0.55)
    .lpf(5500)
    .slow(1.5),

  // gentle shaker - like jhanjh
  s("~ ~ shaker ~ ~ ~ shaker:1 ~")
    .gain(0.03)
    .lpf(2500)
    .room(0.7)
    .slow(2)
)
