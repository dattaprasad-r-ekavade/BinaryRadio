setcps(0.42)

stack(
  // plucked melody - guitar-like sine harmonics
  note("a3 e4 a4 e4 c4 e4 a4 e4 g3 d4 g4 d4 b3 d4 g4 d4")
    .sound("sine")
    .gain(0.16)
    .lpf(3200)
    .room(0.55)
    .size(0.6)
    .delay(0.3)
    .delaytime(0.2)
    .delayfeedback(0.25),

  // warm bass - slow root notes
  note("<a2 ~ ~ ~ ~ ~ ~ ~ g2 ~ ~ ~ ~ ~ ~ ~>")
    .sound("triangle")
    .lpf(350)
    .gain(0.2)
    .room(0.45),

  // high harmonics - like wind chimes in the distance
  note("~ ~ ~ e6 ~ ~ ~ ~ ~ ~ a5 ~ ~ ~ ~ ~, ~ ~ ~ ~ ~ ~ ~ c6 ~ ~ ~ ~ ~ ~ g5 ~")
    .sound("sine")
    .gain(0.04)
    .room(0.92)
    .size(0.95)
    .delay(0.7)
    .delaytime(0.55)
    .delayfeedback(0.6)
    .lpf(5000),

  // soft pad underneath - triangle wave for warmth
  note("<[a2,e3,a3] ~ ~ ~ [g2,d3,g3] ~ ~ ~ [f2,c3,f3] ~ ~ ~ [g2,d3,b3] ~ ~ ~>")
    .sound("triangle")
    .lpf(sine.range(400, 1100).slow(16))
    .gain(0.09)
    .room(0.75)
    .size(0.85),

  // subtle brushed percussion
  s("~ shaker:2 ~ shaker ~ shaker:1 ~ shaker:2")
    .gain(0.05)
    .lpf(2000)
    .room(0.6)
    .slow(1.5)
)
