// ☀️ solar wind v2 — cosmic ambient explorations
// v2: the bass walk was E A D C#, which put a semitone clash under the D and C#m chords;
// now E A B F# recolours every chord without one (E mixolydian only). The melody moves by
// step and third in a three-bar phrase over the four-bar harmony.
setcps(0.4083)
stack(
  // golden shimmer pad: E D C#m A
  note("<[e3,g#3,b3] [d3,f#3,a3] [c#3,e3,g#3] [a2,c#3,e3]>")
    .sound("sawtooth")
    .lpf(sine.range(800, 3000).slow(16))
    .lpq(1.5)
    .gain(0.1)
    .room(0.9)
    .size(0.95),

  // rising solar tones: three bars, so each bar lands on a different chord each time
  note("<[e4 ~ ~ g#4 ~ ~ b4 ~ ~ ~ a4 ~ ~ g#4 ~ ~] [~ ~ f#4 ~ ~ a4 ~ ~ g#4 ~ ~ ~ e4 ~ ~ ~] [~ ~ b4 ~ ~ c#5 ~ b4 ~ ~ ~ ~ a4 ~ f#4 ~]>")
    .sound("sine")
    .gain(0.14)
    .room(0.85)
    .size(0.9)
    .delay(0.5)
    .delaytime(0.3)
    .delayfeedback(0.45)
    .lpf(4000)
    .mask("<0!4 1!24 0!4>"),

  // cosmic bass walk, same every bar
  note("e2 ~ ~ ~ a2 ~ ~ ~ b1 ~ ~ ~ f#2 ~ ~ ~")
    .sound("triangle")
    .lpf(500)
    .gain(0.2)
    .room(0.5)
    .size(0.6),

  // orbital accents: sample variants, slight level drift
  s("~ ~ ~ hh:2 ~ ~ ~ hh:1 ~ ~ ~ hh:3 ~ ~ ~ hh")
    .gain(perlin.range(0.05, 0.08))
    .room(0.7)
    .size(0.8)
    .lpf(5000),

  // stardust texture
  note("~ ~ b5 ~ ~ ~ ~ e6 ~ ~ g#5 ~ ~ ~ ~ b5")
    .sound("sine")
    .degradeBy(0.3)
    .gain(0.05)
    .room(0.99)
    .size(0.99)
    .delay(0.8)
    .delaytime(0.66)
    .delayfeedback(0.55)
    .lpf(6000),

  // solar flare swell
  note("<~ [e4,g#4,b4] ~ ~ ~ [d4,f#4,a4] ~ ~>")
    .sound("sawtooth")
    .attack(0.6)
    .release(1.2)
    .lpf(2000)
    .gain(0.06)
    .room(0.8)
    .size(0.9)
    .slow(2)
)
