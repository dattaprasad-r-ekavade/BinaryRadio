// 🌅 goa sunset v2 — warm pads, sitar echoes and sea
// v2: the "sitar" is a plucked, resonant saw with vibrato instead of a plain sine; the melody
// is a three-bar phrase over the four-chord pad (C Dm Em F, C major only); the percussion sits
// on the bar grid in a 3-3-2 pattern instead of drifting; the sea is noise that rolls in and out.
setcps(0.3833)
stack(
  // warm beach pad
  note("<[c3,e3,g3] [d3,f3,a3] [e3,g3,b3] [f3,a3,c4]>")
    .sound("sawtooth")
    .lpf(sine.range(400, 1200).slow(16))
    .gain(0.11)
    .room(0.85)
    .size(0.9),

  // sitar-ish lead: three bars, so each one meets a different chord every time round
  note("<[e4 ~ g4 a4 ~ b4 ~ ~ a4 g4 ~ e4 ~ ~ ~ ~] [~ ~ d4 ~ e4 ~ g4 ~ ~ ~ a4 ~ g4 ~ ~ ~] [~ ~ c5 ~ ~ b4 ~ a4 ~ ~ g4 ~ ~ e4 ~ ~]>")
    .sound("sawtooth")
    .attack(0.005)
    .decay(0.35)
    .sustain(0.3)
    .lpf(2400)
    .lpq(7)
    .vib(5.5)
    .vibmod(0.1)
    .gain(0.12)
    .room(0.75)
    .size(0.8)
    .delay(0.55)
    .delaytime(0.489)
    .delayfeedback(0.4)
    .mask("<0!4 1!18 0!2 1!12>"),

  // bass walk, same every bar
  note("c2 ~ ~ ~ g1 ~ ~ ~ c2 ~ f1 ~ ~ g1 ~ ~")
    .sound("triangle")
    .lpf(350)
    .gain(0.21)
    .room(0.45),

  // hand drum in 3-3-2, quiet ghost notes between
  s("bd:2 ~ ~ lt ~ ~ bd:1 ~ bd:2 ~ ~ lt ~ ~ rim ~")
    .gain(perlin.range(0.08, 0.14))
    .lpf(2200)
    .room(0.55)
    .mask("<0!4 1!28>"),

  s("~ hh:1 ~ ~ hh:2 ~ ~ hh:1 ~ hh:2 ~ ~ hh:1 ~ ~ hh:2")
    .degradeBy(0.2)
    .gain(0.04)
    .lpf(3000)
    .room(0.5),

  // the sea: waves every two bars
  sound("pink")
    .attack(0.6)
    .release(0.8)
    .hpf(400)
    .lpf(sine.range(1200, 4000).slow(2))
    .gain(sine.range(0.005, 0.04).slow(2)),

  // sparkle
  note("<~ ~ c6 ~ ~ ~ e6 ~ ~ ~ g6 ~ ~ ~ b6 ~ ~>")
    .sound("sine")
    .gain(0.045)
    .room(0.95)
    .size(0.98)
    .delay(0.7)
    .delaytime(0.5)
    .delayfeedback(0.6)
    .lpf(6500)
    .slow(2)
)
