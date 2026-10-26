// 🌃 midnight drive v2 — synthwave cruise, one chord per bar
// v2: bass, arp and pad all change on the same bar line (Cm Bb Ab Eb, C aeolian only),
// a sparse syncopated lead over the arp, backbeat on 2 and 4, a 32-bar form with a drum break.
setcps(0.45)
stack(
  // driving octave bass, one chord per bar
  note("<[c2 c2 c3 c2 c2 c2 c3 c2] [bb1 bb1 bb2 bb1 bb1 bb1 bb2 bb1] [ab1 ab1 ab2 ab1 ab1 ab1 ab2 ab1] [eb2 eb2 eb3 eb2 eb2 eb2 eb3 eb2]>")
    .sound("sawtooth")
    .lpf(sine.range(220, 900).slow(12))
    .lpq(4)
    .gain(0.26)
    .room(0.2)
    .distort(0.15),

  // arpeggio follows the chord; dotted-eighth echo (0.417 s at 108 BPM)
  note("<[c4 eb4 g4 bb4 c5 bb4 g4 eb4] [bb3 d4 f4 bb4 d5 bb4 f4 d4] [ab3 c4 eb4 g4 c5 g4 eb4 c4] [eb4 g4 bb4 d5 eb5 d5 bb4 g4]>")
    .sound("sawtooth")
    .lpf(sine.range(1800, 3600).slow(20))
    .gain(perlin.range(0.08, 0.12))
    .room(0.5)
    .size(0.6)
    .delay(0.35)
    .delaytime(0.417)
    .delayfeedback(0.4),

  // pad: same chord as bass and arp
  note("<[c3,eb3,g3,bb3] [bb2,d3,f3,a3] [ab2,c3,eb3,g3] [eb3,g3,bb3,d4]>")
    .sound("sawtooth")
    .lpf(1200)
    .lpq(1.5)
    .gain(0.09)
    .room(0.8)
    .size(0.9),

  // lead: narrow (eb4-eb5), mostly off the beat, rests between phrases; bars 9-24
  note("<[~ ~ g4 ~ ~ bb4 ~ c5 ~ ~ ~ ~ bb4 ~ g4 ~] [~ ~ f4 ~ ~ bb4 ~ d5 ~ ~ ~ ~ c5 ~ bb4 ~] [~ ~ eb4 ~ ~ ab4 ~ c5 ~ ~ ~ ~ bb4 ~ g4 ~] [~ ~ g4 ~ ~ bb4 ~ eb5 ~ ~ d5 ~ ~ ~ ~ ~]>")
    .sound("square")
    .lpf(2800)
    .gain(0.13)
    .room(0.55)
    .size(0.7)
    .delay(0.3)
    .delaytime(0.417)
    .delayfeedback(0.35)
    .mask("<0!8 1!16 0!8>"),

  // kick: steady four, drops out for bars 25-28
  s("bd ~ ~ ~ bd ~ ~ ~ bd ~ ~ ~ bd ~ ~ bd")
    .gain(0.32)
    .room(0.2)
    .mask("<0!4 1!20 0!4 1!4>"),

  // backbeat on 2 and 4
  s("~ ~ ~ ~ cp ~ ~ ~ ~ ~ ~ ~ cp ~ ~ ~")
    .gain(0.22)
    .room(0.35)
    .mask("<0!4 1!20 0!4 1!4>"),

  // hats: sample variants and drifting level instead of one fixed hit
  s("[hh hh:1 hh:2 hh:1]*4")
    .gain(perlin.range(0.05, 0.11))
    .lpf(6000)
    .room(0.2)
)
