// 🔥 campfire tales v2 — fingerpicked folk by the fire
// v2: one chord per bar (Am G F G, A aeolian only) shared by guitar, pad and bass; the pad and
// bass no longer go silent for three bars in four. A hummed melody enters and leaves, the bass
// walk recolours each chord, and a real fire crackles.
setcps(0.3667)
stack(
  // plucked guitar: picking pattern follows the chord
  note("<[a3 e4 a4 e4 c4 e4 a4 e4 a3 e4 a4 e4 c5 e4 a4 e4] [g3 d4 g4 d4 b3 d4 g4 d4 g3 d4 g4 d4 b4 d4 g4 d4] [f3 c4 f4 c4 a3 c4 f4 c4 f3 c4 f4 c4 a4 c4 f4 c4] [g3 d4 g4 d4 b3 d4 g4 d4 g3 d4 b4 d4 d5 d4 b4 d4]>")
    .sound("triangle")
    .decay(0.25)
    .sustain(0.15)
    .gain(perlin.range(0.11, 0.16))
    .lpf(3200)
    .room(0.5)
    .size(0.6)
    .delay(0.2)
    .delaytime(0.2)
    .delayfeedback(0.2),

  // hummed melody: four bars in, four bars out
  note("<[~ ~ e4 ~ ~ a4 ~ ~ c5 ~ ~ b4 ~ a4 ~ ~] [~ ~ b4 ~ ~ g4 ~ ~ d4 ~ ~ ~ ~ ~ ~ ~] [~ ~ a4 ~ ~ c5 ~ ~ a4 ~ ~ g4 ~ f4 ~ ~] [~ ~ g4 ~ ~ b4 ~ ~ a4 ~ ~ ~ ~ ~ ~ ~]>")
    .sound("sine")
    .gain(0.13)
    .lpf(2000)
    .room(0.6)
    .size(0.7)
    .mask("<0!4 1!8 0!4>"),

  // warm bass walk, same every bar: Am, then G/A, Em7 ... F/A, Fmaj7/E, G11 ...
  note("a2 ~ ~ ~ ~ ~ e2 ~ ~ ~ g2 ~ ~ ~ ~ ~")
    .sound("triangle")
    .lpf(350)
    .gain(0.19)
    .room(0.4),

  // soft pad under everything
  note("<[a2,e3,c4] [g2,d3,b3] [f2,c3,a3] [g2,d3,b3]>")
    .sound("triangle")
    .lpf(sine.range(400, 1100).slow(14))
    .gain(0.08)
    .room(0.75)
    .size(0.85),

  // brushed shaker
  s("~ sh ~ sh ~ sh ~ sh")
    .gain(perlin.range(0.03, 0.06))
    .lpf(2500)
    .room(0.6),

  // the fire
  sound("crackle")
    .density(0.06)
    .gain(0.1)
    .lpf(5000)
    .hpf(800)
)
