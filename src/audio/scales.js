/**
 * Musical key and scale helpers for the demo booth keyboard.
 *
 * A parsed key is `{ root, name, intervals }`: `root` is the tonic pitch class
 * (C = 0 … B = 11) and `intervals` are semitone offsets from that tonic.
 */

const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const MAJOR = [0, 2, 4, 5, 7, 9, 11]
const MINOR = [0, 2, 3, 5, 7, 8, 10]
const BHAIRAV = [0, 1, 4, 5, 7, 8, 11]
const SLENDRO = [0, 2, 5, 7, 9]
const SLENDRO_DEFAULT_ROOT = 2 // D

const DEFAULT_KEY = { root: 0, name: 'C', intervals: MAJOR }

/** Turns 'b'/'#' and the unicode ♭/♯ into 'b' and '#'. Returns '' or one accidental. */
function normalizeAccidental(acc) {
  if (acc === '#' || acc === '♯') return '#'
  if (acc === 'b' || acc === '♭') return 'b'
  return ''
}

/** Pitch class (0-11) for a letter plus accidental, e.g. ('F', '#') -> 6. */
function pitchClass(letter, acc) {
  const offset = acc === '#' ? 1 : acc === 'b' ? -1 : 0
  return (((LETTER_PC[letter] + offset) % 12) + 12) % 12
}

function parseKeyUnsafe(key) {
  if (typeof key !== 'string') return { ...DEFAULT_KEY }
  const s = key.trim()
  if (!s) return { ...DEFAULT_KEY }

  // An optional leading note sets the root, but only when a space follows it,
  // so 'Bhairav' is not read as 'B' plus 'hairav'.
  const rootPrefix = /^([A-Ga-g])([#♯b♭]?)\s+/.exec(s)
  const prefixRoot = rootPrefix
    ? pitchClass(rootPrefix[1].toUpperCase(), normalizeAccidental(rootPrefix[2]))
    : null
  const prefixName = rootPrefix
    ? `${rootPrefix[1].toUpperCase()}${normalizeAccidental(rootPrefix[2])}`
    : null

  if (/bhairav/i.test(s)) {
    const root = prefixRoot ?? 0
    const rootName = prefixName ?? 'C'
    return { root, name: `${rootName} Bhairav`, intervals: [...BHAIRAV] }
  }

  if (/slendro/i.test(s)) {
    const root = prefixRoot ?? SLENDRO_DEFAULT_ROOT
    const rootName = prefixName ?? 'D'
    return { root, name: `${rootName} slendro`, intervals: [...SLENDRO] }
  }

  // Major or natural minor: 'C', 'F#m', 'Bb', 'Ebm', 'Dm', 'Am min', ...
  const m = /^([A-Ga-g])([#♯b♭]?)\s*(.*)$/.exec(s)
  if (!m) return { ...DEFAULT_KEY }
  const letter = m[1].toUpperCase()
  const acc = normalizeAccidental(m[2])
  const suffix = m[3].trim()
  const isMinor = suffix === 'm' || /^min(or)?$/i.test(suffix)
  if (suffix !== '' && !isMinor && !/^M(aj(or)?)?$/i.test(suffix)) {
    // Unrecognised suffix: fall back to C major rather than guess.
    return { ...DEFAULT_KEY }
  }
  return {
    root: pitchClass(letter, acc),
    name: `${letter}${acc}${isMinor ? 'm' : ''}`,
    intervals: isMinor ? [...MINOR] : [...MAJOR],
  }
}

/**
 * Parses a manifest key such as 'Dm', 'F#m', 'Bb', 'C Bhairav' or 'slendro'.
 * Never throws; unknown or empty input gives C major.
 * @returns {{ root: number, name: string, intervals: number[] }}
 */
export function parseKey(key) {
  try {
    return parseKeyUnsafe(key)
  } catch {
    return { ...DEFAULT_KEY }
  }
}

/** Accepts a parsed key object or a key string. */
function resolveScale(scale) {
  if (typeof scale === 'string') return parseKey(scale)
  if (scale && Array.isArray(scale.intervals) && Number.isFinite(scale.root)) return scale
  return parseKey('')
}

/** True when the MIDI note's pitch class belongs to the scale. */
export function isInScale(midi, scale) {
  if (!Number.isFinite(midi)) return false
  const s = resolveScale(scale)
  const rel = (((Math.round(midi) - s.root) % 12) + 12) % 12
  return s.intervals.includes(rel)
}

/**
 * Nearest MIDI note whose pitch class is in the scale. A tie between a note
 * below and a note above goes down.
 */
export function snapToScale(midi, scale) {
  if (!Number.isFinite(midi)) return midi
  const n = Math.round(midi)
  const s = resolveScale(scale)
  if (isInScale(n, s)) return n
  for (let d = 1; d <= 12; d++) {
    if (isInScale(n - d, s)) return n - d
    if (isInScale(n + d, s)) return n + d
  }
  return n
}

/** Equal-tempered frequency in Hz (A4 = MIDI 69 = 440 Hz). */
export function midiToFreq(midi) {
  return 440 * 2 ** ((midi - 69) / 12)
}
