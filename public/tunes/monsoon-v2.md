// 🌧️ monsoon v2 — raga Bhairav in the rain
// v2: the melody is now in Bhairav (S r G m P d N = C Db E F G Ab B). v1 used natural A,
// which Bhairav does not have. The phrases follow its pakad: G m d d P, G m r r S, an ascent
// to taar Sa, and a fall that rests on Pa. Tanpura plucks Pa-Sa-Sa-Sa; rain under everything.
setcps(0.3833)
stack(
  // tanpura: P. S S S. each bar
  note("g2 c3 c3 c2")
    .sound("triangle")
    .attack(0.02)
    .decay(1.2)
    .sustain(0.25)
    .lpf(sine.range(500, 1200).slow(20))
    .gain(0.1)
    .room(0.8)
    .size(0.9),

  // deep Sa drone
  note("c2")
    .sound("sawtooth")
    .lpf(160)
    .gain(0.12)
    .room(0.5),

  // Bhairav melody: four-bar phrase, vadi d (Ab) and samvadi r (Db) leaned on
  note("<[e4 ~ f4 ~ ab4 ~ ~ ab4 ~ ~ g4 ~ ~ ~ ~ ~] [~ ~ e4 ~ f4 ~ ~ db4 ~ ~ db4 ~ c4 ~ ~ ~] [~ ~ c4 ~ e4 ~ f4 ~ g4 ~ ~ ab4 ~ b4 ~ c5] [~ ~ db5 ~ c5 ~ ~ b4 ~ ab4 ~ ~ g4 ~ ~ ~]>")
    .sound("sine")
    .vib(5)
    .vibmod(0.08)
    .gain(0.14)
    .room(0.7)
    .size(0.8)
    .delay(0.35)
    .delaytime(0.33)
    .delayfeedback(0.3)
    .lpf(2800)
    .mask("<0!4 1!16 0!4 1!8>"),

  // tabla-ish keherwa over two bars: dha ge na ti / na ka dhi na
  s("<[bd:1 ~ ~ ~ lt ~ ~ ~ rim ~ ~ ~ lt ~ ~ ~] [rim ~ ~ ~ lt ~ ~ ~ bd:1 ~ ~ ~ lt ~ ~ ~]>")
    .gain(perlin.range(0.07, 0.11))
    .lpf(2000)
    .room(0.45)
    .mask("<0!4 1!28>"),

  // sitar-like overtones, sparse
  note("<~ ~ ~ e6 ~ ~ ~ ~ ~ ~ c6 ~ ~ ~ ~ ~ ~ ~ g5 ~ ~ ~ ~ ~>")
    .sound("sine")
    .gain(0.04)
    .room(0.9)
    .size(0.95)
    .delay(0.65)
    .delaytime(0.45)
    .delayfeedback(0.55)
    .lpf(5500),

  // the rain
  sound("pink")
    .attack(0.5)
    .release(0.5)
    .hpf(1200)
    .lpf(6000)
    .gain(sine.range(0.015, 0.04).slow(13)),

  // jhanjh-like shaker
  s("~ ~ sh ~ ~ ~ sh ~")
    .gain(perlin.range(0.02, 0.04))
    .lpf(2500)
    .room(0.7)
)
