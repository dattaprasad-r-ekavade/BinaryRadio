// 🔥 campfire tales v2 — fingerpicked folk by the fire
// v2: one chord per bar shared by guitar, pad and bass (A aeolian only); a hummed melody,
// a bass walk that recolours each chord, and a real fire crackling.
// v2.1 (review: "feels like looping game music, needs some more tunes"): v2 repeated one
// 4-bar phrase over one 4-chord loop. Now a 16-bar song: verse (Am G F G) twice with a varied
// second line, then a chorus that climbs higher on new chords (F C G Am, F C Dm G). The bass
// walks in the verse and holds roots in the chorus; a low counter-line answers in verse two.
setcps(0.3667)

// guitar picking per chord, and the 16-bar chord order
const am = 'a3 e4 a4 e4 c4 e4 a4 e4 a3 e4 a4 e4 c5 e4 a4 e4'
const g = 'g3 d4 g4 d4 b3 d4 g4 d4 g3 d4 g4 d4 b4 d4 g4 d4'
const gTurn = 'g3 d4 g4 d4 b3 d4 g4 d4 g3 d4 b4 d4 d5 d4 b4 d4'
const f = 'f3 c4 f4 c4 a3 c4 f4 c4 f3 c4 f4 c4 a4 c4 f4 c4'
const c = 'c3 g3 c4 g3 e3 g3 c4 g3 c3 g3 c4 g3 e4 g3 c4 g3'
const dm = 'd3 a3 d4 a3 f3 a3 d4 a3 d3 a3 d4 a3 f4 a3 d4 a3'
const bars = [am, g, f, gTurn, am, g, f, gTurn, f, c, g, am, f, c, dm, gTurn]

stack(
  // plucked guitar
  note('<' + bars.map((b) => '[' + b + ']').join(' ') + '>')
    .sound("triangle")
    .decay(0.25)
    .sustain(0.15)
    .gain(perlin.range(0.11, 0.16))
    .lpf(3200)
    .room(0.5)
    .size(0.6)
    .delay(0.2)
    .delaytime(0.511)
    .delayfeedback(0.2),

  // hummed melody: verse, varied verse, chorus, chorus answer
  note("<[~ ~ e4 ~ ~ a4 ~ ~ c5 ~ ~ b4 ~ a4 ~ ~] [~ ~ b4 ~ ~ g4 ~ ~ d4 ~ ~ ~ ~ ~ ~ ~] [~ ~ a4 ~ ~ c5 ~ ~ a4 ~ ~ g4 ~ f4 ~ ~] [~ ~ g4 ~ ~ b4 ~ ~ a4 ~ ~ ~ ~ ~ ~ ~] [~ ~ e4 ~ ~ a4 ~ ~ c5 ~ ~ d5 ~ e5 ~ ~] [~ ~ d5 ~ ~ b4 ~ ~ g4 ~ ~ ~ a4 ~ b4 ~] [~ ~ c5 ~ ~ a4 ~ ~ f4 ~ ~ g4 ~ a4 ~ ~] [~ ~ b4 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~] [~ ~ c5 ~ ~ ~ ~ ~ a4 ~ ~ c5 ~ ~ ~ ~] [~ ~ e5 ~ ~ ~ ~ ~ d5 ~ ~ c5 ~ ~ ~ ~] [~ ~ d5 ~ ~ ~ ~ ~ b4 ~ ~ g4 ~ ~ ~ ~] [~ ~ c5 ~ ~ b4 ~ a4 ~ ~ ~ ~ ~ ~ ~ ~] [~ ~ a4 ~ ~ c5 ~ ~ f5 ~ ~ e5 ~ ~ ~ ~] [~ ~ e5 ~ ~ d5 ~ ~ c5 ~ ~ ~ g4 ~ ~ ~] [~ ~ f4 ~ ~ a4 ~ ~ d5 ~ ~ c5 ~ ~ ~ ~] [~ ~ b4 ~ ~ ~ ~ ~ d5 ~ ~ ~ ~ ~ ~ ~]>")
    .sound("sine")
    .gain(0.13)
    .lpf(2000)
    .room(0.6)
    .size(0.7)
    .mask("<0!4 1!28>"),

  // low counter-line answering the melody in verse two only
  note("<~!4 [~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ e3 ~ g3 ~] [a3 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ b3 ~ ~ ~] [~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ c4 ~ a3 ~] [g3 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~] ~!8>")
    .sound("triangle")
    .attack(0.05)
    .release(0.6)
    .gain(0.09)
    .lpf(1200)
    .room(0.5),

  // bass: walk in the verse, roots in the chorus
  note("<[a2 ~ ~ ~ ~ ~ e2 ~ ~ ~ g2 ~ ~ ~ ~ ~]!8 [f2 ~ ~ ~ ~ ~ c2 ~ f2 ~ ~ ~ ~ ~ ~ ~] [c2 ~ ~ ~ ~ ~ g2 ~ c2 ~ ~ ~ ~ ~ ~ ~] [g2 ~ ~ ~ ~ ~ d2 ~ g2 ~ ~ ~ ~ ~ ~ ~] [a2 ~ ~ ~ ~ ~ e2 ~ a2 ~ ~ ~ ~ ~ ~ ~] [f2 ~ ~ ~ ~ ~ c2 ~ f2 ~ ~ ~ ~ ~ ~ ~] [c2 ~ ~ ~ ~ ~ g2 ~ c2 ~ ~ ~ ~ ~ ~ ~] [d2 ~ ~ ~ ~ ~ a2 ~ d2 ~ ~ ~ ~ ~ ~ ~] [g2 ~ ~ ~ ~ ~ d2 ~ g2 ~ ~ ~ e2 ~ ~ ~]>")
    .sound("triangle")
    .lpf(350)
    .gain(0.19)
    .room(0.4),

  // soft pad under everything
  note("<[a2,e3,c4] [g2,d3,b3] [f2,c3,a3] [g2,d3,b3] [a2,e3,c4] [g2,d3,b3] [f2,c3,a3] [g2,d3,b3] [f2,c3,a3] [c3,g3,e4] [g2,d3,b3] [a2,e3,c4] [f2,c3,a3] [c3,g3,e4] [d3,a3,f4] [g2,d3,b3]>")
    .sound("triangle")
    .lpf(sine.range(400, 1100).slow(14))
    .gain(0.08)
    .room(0.75)
    .size(0.85),

  // brushed shaker, busier in the chorus
  s("<[~ sh ~ sh ~ sh ~ sh]!8 [~ sh sh sh ~ sh sh sh]!8>")
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
