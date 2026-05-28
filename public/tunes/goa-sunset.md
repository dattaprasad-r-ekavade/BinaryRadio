setcps(0.42)

stack(
  // warm beach pad - sunset hues
  note("<[c3,e3,g3] [d3,f3,a3] [e3,g3,b3] [f3,a3,c4]>")
    .sound("sawtooth")
    .lpf(sine.range(400, 1200).slow(16))
    .gain(0.12)
    .room(0.85)
    .size(0.9),

  // melodic sitar-ish lead
  note("e4 ~ g4 a4 ~ b4 ~ ~ a4 g4 ~ e4 ~ d4 ~ e4 ~")
    .sound("sine")
    .gain(0.15)
    .room(0.8)
    .size(0.85)
    .delay(0.6)
    .delaytime(0.28)
    .delayfeedback(0.4)
    .lpf(2800),

  // deep bass groove
  note("c2 ~ ~ ~ g1 ~ ~ ~ c2 ~ f1 ~ ~ g1 ~ ~")
    .sound("triangle")
    .lpf(350)
    .gain(0.22)
    .room(0.5),

  // light percussion - waves & shells
  s("bd:2 ~ ~ hh:1 ~ ~ bd:1 ~ ~ hh:2 ~ ~ ~ ~")
    .gain("0.18 0 0 0.06 0 0 0.14 0 0 0.05 0 0 0 0")
    .lpf(2200)
    .room(0.6)
    .slow(1.2),

  // high sparkling textures - sea spray
  note("<~ ~ c6 ~ ~ ~ e6 ~ ~ ~ g6 ~ ~ ~ b6 ~ ~>")
    .sound("sine")
    .gain(0.05)
    .room(0.95)
    .size(0.98)
    .delay(0.7)
    .delaytime(0.5)
    .delayfeedback(0.6)
    .lpf(6500)
    .slow(2)
)