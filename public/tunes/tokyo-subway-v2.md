// 🚇 tokyo subway v2 — broken beat under the city
// v2: v1's Dm7 stab used F natural against an E minor lead; the harmony is now E aeolian only
// (Em9, Cmaj7, D6, Em7, two bars each), the sub follows it instead of sitting silent for seven
// bars in eight, and the lead is a three-bar pentatonic phrase that meets each chord differently.
setcps(0.4917)
stack(
  // broken beat
  s("bd ~ ~ bd:3 ~ ~ ~ ~ ~ ~ bd ~ ~ ~ ~ ~")
    .gain(0.22)
    .lpf(2800)
    .room(0.3),

  s("~ ~ ~ ~ cp ~ ~ ~ ~ ~ ~ ~ cp:1 ~ ~ ~")
    .gain(0.14)
    .room(0.35)
    .mask("<0!2 1!30>"),

  // hats with sample variants and the odd double hit
  s("[hh:4 hh:2 hh:4 hh:2]*4")
    .gain(perlin.range(0.03, 0.07))
    .sometimesBy(0.12, (x) => x.ply(2))
    .lpf(5000)
    .room(0.3),

  // metallic lead: E minor pentatonic, e4-e5
  note("<[e5 ~ ~ d5 ~ b4 ~ ~ ~ ~ g4 ~ a4 ~ ~ ~] [~ ~ b4 ~ ~ d5 ~ e5 ~ ~ ~ ~ d5 ~ b4 ~] [~ ~ ~ ~ a4 ~ g4 ~ ~ ~ e4 ~ ~ ~ ~ ~]>")
    .sound("square")
    .lpf(sine.range(900, 2400).slow(6))
    .lpq(4)
    .gain(0.08)
    .room(0.6)
    .delay(0.45)
    .delaytime(0.381)
    .delayfeedback(0.45)
    .mask("<0!4 1!20 0!8>"),

  // sub on the chord roots
  note("<e2 c2 d2 e2>")
    .slow(2)
    .struct("x ~ ~ x ~ ~ ~ ~ ~ ~ x ~ ~ ~ ~ ~")
    .sound("sawtooth")
    .lpf(200)
    .gain(0.2)
    .room(0.2),

  // pad stabs, two bars per chord
  note("<[e3,g3,b3,d4,f#4] [c3,e3,g3,b3] [d3,f#3,a3,b3] [e3,g3,b3,d4]>")
    .slow(2)
    .struct("x ~ ~ x ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~")
    .sound("sawtooth")
    .lpf(900)
    .lpq(1)
    .gain(0.08)
    .room(0.7)
    .size(0.8),

  // tunnel rumble
  s("~ ~ noise:0 ~ ~ ~ ~ ~")
    .gain(0.02)
    .lpf(sine.range(600, 1500).slow(8))
    .room(0.5)
    .size(0.6)
)
