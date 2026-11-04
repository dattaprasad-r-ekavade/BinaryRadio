/**
 * A small Web Audio synth for the demo booth keyboard. It is separate from
 * the Strudel engine so key presses respond at once. The AudioContext is
 * created on the first note, so nothing runs until the visitor plays.
 */
import { midiToFreq } from './scales.js'

const ATTACK = 0.01
const DECAY = 0.15
const SUSTAIN = 0.6
const RELEASE = 0.35
const MASTER_GAIN = 0.35

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

function getAudioContextCtor() {
  if (typeof window === 'undefined') return null
  return window.AudioContext || window.webkitAudioContext || null
}

/**
 * @returns {{ noteOn(midi:number, velocity?:number):void, noteOff(midi:number):void,
 *   allOff():void, setVolume(v:number):void, dispose():void }}
 */
export function createKeyboardSynth() {
  let ctx = null
  let master = null
  let volume = 1
  const voices = new Map()

  function ensureContext() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume?.().catch?.(() => {})
      return ctx
    }
    const Ctor = getAudioContextCtor()
    if (!Ctor) return null
    try {
      ctx = new Ctor({ latencyHint: 'interactive' })
      master = ctx.createGain()
      master.gain.value = MASTER_GAIN * volume
      master.connect(ctx.destination)
      if (ctx.state === 'suspended') ctx.resume?.().catch?.(() => {})
      return ctx
    } catch {
      ctx = null
      master = null
      return null
    }
  }

  /** Cuts a voice almost at once (used when a held note is retriggered). */
  function killVoice(voice, now) {
    const { env, oscs } = voice
    env.gain.cancelScheduledValues(now)
    env.gain.setValueAtTime(env.gain.value, now)
    env.gain.linearRampToValueAtTime(0, now + 0.02)
    oscs.forEach((o) => o.stop(now + 0.03))
  }

  function noteOn(midi, velocity = 0.8) {
    const c = ensureContext()
    if (!c || !master || !Number.isFinite(midi)) return

    const now = c.currentTime
    const existing = voices.get(midi)
    if (existing) {
      killVoice(existing, now)
      voices.delete(midi)
    }

    const vel = clamp(Number.isFinite(velocity) ? velocity : 0.8, 0, 1)
    const freq = midiToFreq(midi)

    const saw = c.createOscillator()
    saw.type = 'sawtooth'
    saw.frequency.value = freq
    saw.detune.value = -6
    const sub = c.createOscillator()
    sub.type = 'square'
    sub.frequency.value = freq / 2
    sub.detune.value = 6

    const sawGain = c.createGain()
    sawGain.gain.value = 0.5
    const subGain = c.createGain()
    subGain.gain.value = 0.2

    const filter = c.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 1.5
    const cutoffPeak = 800 + 3200 * vel
    const cutoffSustain = 500 + 1200 * vel
    filter.frequency.setValueAtTime(cutoffSustain * 0.6, now)
    filter.frequency.linearRampToValueAtTime(cutoffPeak, now + ATTACK)
    filter.frequency.setTargetAtTime(cutoffSustain, now + ATTACK, DECAY / 3)

    const env = c.createGain()
    env.gain.setValueAtTime(0, now)
    env.gain.linearRampToValueAtTime(vel, now + ATTACK)
    env.gain.setTargetAtTime(vel * SUSTAIN, now + ATTACK, DECAY / 3)

    saw.connect(sawGain).connect(filter)
    sub.connect(subGain).connect(filter)
    filter.connect(env).connect(master)

    saw.start(now)
    sub.start(now)

    const voice = { env, oscs: [saw, sub], nodes: [saw, sub, sawGain, subGain, filter, env] }
    saw.onended = () => {
      voice.nodes.forEach((n) => {
        try {
          n.disconnect()
        } catch {
          // Already disconnected.
        }
      })
    }
    voices.set(midi, voice)
  }

  function noteOff(midi) {
    const voice = voices.get(midi)
    if (!voice) return
    voices.delete(midi)
    if (!ctx) return
    const now = ctx.currentTime
    const { env, oscs } = voice
    env.gain.cancelScheduledValues(now)
    env.gain.setValueAtTime(env.gain.value, now)
    env.gain.linearRampToValueAtTime(0, now + RELEASE)
    oscs.forEach((o) => o.stop(now + RELEASE + 0.05))
  }

  function allOff() {
    Array.from(voices.keys()).forEach(noteOff)
  }

  function setVolume(v) {
    volume = clamp(Number.isFinite(v) ? v : 1, 0, 1)
    if (master && ctx) master.gain.setTargetAtTime(MASTER_GAIN * volume, ctx.currentTime, 0.02)
  }

  /** Stops all notes and closes the context. A later noteOn opens a new one. */
  function dispose() {
    allOff()
    voices.clear()
    const c = ctx
    ctx = null
    master = null
    if (c) c.close?.().catch?.(() => {})
  }

  return { noteOn, noteOff, allOff, setVolume, dispose }
}
