// 🌃 midnight drive — synthwave cruise through the city
setcps(0.35)
stack(
  // driving bass pulse
  note("c2 c2 ~ c2 bb1 bb1 ~ bb1 ab1 ab1 ~ ab1 eb2 eb2 ~ eb2")
    .sound("sawtooth")
    .lpf(sine.range(200, 900).slow(8))
    .lpq(4)
    .gain(0.3)
    .room(0.3)
    .distort(0.2),

  // arpeggiated lead
  note("c4 eb4 g4 bb4 c4 eb4 bb3 g3 ab3 c4 eb4 g4 ab3 bb3 eb4 g4")
    .sound("sawtooth")
    .lpf(3500)
    .gain(0.16)
    .room(0.5)
    .size(0.6)
    .delay(0.4)
    .delaytime(0.375)
    .delayfeedback(0.45),

  // wide pad chords
  note("<[c3,eb3,g3,bb3] [bb2,eb3,g3] [ab2,c3,eb3] [eb3,g3,bb3]>")
    .sound("sawtooth")
    .lpf(1200)
    .lpq(1.5)
    .gain(0.1)
    .room(0.8)
    .size(0.9),

  // punchy kick / snare pattern
  s("bd ~ ~ bd ~ ~ bd ~ bd ~ ~ bd ~ bd ~ ~")
    .gain(0.35)
    .room(0.2),

  s("~ ~ cp ~ ~ ~ cp ~ ~ ~ cp ~ ~ ~ cp ~")
    .gain(0.25)
    .room(0.3),

  // hi-hat groove
  s("hh hh:1 hh hh:2 hh hh:1 hh ~ hh hh:3 hh hh:1 hh hh:2 hh ~")
    .gain(0.1)
    .lpf(6000)
    .room(0.2)
)
