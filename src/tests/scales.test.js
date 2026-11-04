import { describe, expect, it } from 'vitest'
import manifest from '../../public/tunes/manifest.json'
import { isInScale, midiToFreq, parseKey, snapToScale } from '../audio/scales.js'

const distinctKeys = [...new Set(manifest.map((t) => t.key))]

describe('parseKey', () => {
  it('parses every distinct manifest key without throwing', () => {
    expect(distinctKeys.length).toBeGreaterThan(0)
    for (const key of distinctKeys) {
      const parsed = parseKey(key)
      expect(parsed.root).toBeGreaterThanOrEqual(0)
      expect(parsed.root).toBeLessThanOrEqual(11)
      expect(typeof parsed.name).toBe('string')
      expect(parsed.intervals.length).toBeGreaterThan(0)
    }
  })

  it('parses major keys', () => {
    expect(parseKey('C')).toEqual({ root: 0, name: 'C', intervals: [0, 2, 4, 5, 7, 9, 11] })
    expect(parseKey('E').root).toBe(4)
    expect(parseKey('D').root).toBe(2)
  })

  it('parses natural minor keys with sharps and flats', () => {
    expect(parseKey('Am')).toEqual({ root: 9, name: 'Am', intervals: [0, 2, 3, 5, 7, 8, 10] })
    expect(parseKey('F#m')).toMatchObject({ root: 6, name: 'F#m' })
    expect(parseKey('Dm').root).toBe(2)
    expect(parseKey('Bb')).toMatchObject({ root: 10, name: 'Bb', intervals: [0, 2, 4, 5, 7, 9, 11] })
    expect(parseKey('Ebm')).toMatchObject({ root: 3, name: 'Ebm', intervals: [0, 2, 3, 5, 7, 8, 10] })
  })

  it('parses the Bhairav raga', () => {
    const parsed = parseKey('C Bhairav')
    expect(parsed.root).toBe(0)
    expect(parsed.name).toBe('C Bhairav')
    expect(parsed.intervals).toEqual([0, 1, 4, 5, 7, 8, 11])
  })

  it('parses slendro, defaulting the root to D', () => {
    const parsed = parseKey('slendro')
    expect(parsed.root).toBe(2)
    expect(parsed.intervals).toEqual([0, 2, 5, 7, 9])
  })

  it('falls back to C major for unknown or empty input and never throws', () => {
    for (const bad of ['', '   ', 'H#zz', null, undefined, 42, {}]) {
      expect(() => parseKey(bad)).not.toThrow()
      expect(parseKey(bad)).toMatchObject({ root: 0, intervals: [0, 2, 4, 5, 7, 9, 11] })
    }
  })
})

describe('isInScale', () => {
  const aMinor = parseKey('Am')

  it('accepts notes of the scale in any octave', () => {
    expect(isInScale(57, aMinor)).toBe(true) // A3
    expect(isInScale(64, aMinor)).toBe(true) // E4
    expect(isInScale(60, aMinor)).toBe(true) // C4
  })

  it('rejects chromatic notes outside the scale', () => {
    expect(isInScale(58, aMinor)).toBe(false) // A#3
    expect(isInScale(61, aMinor)).toBe(false) // C#4
  })

  it('accepts a parsed key string directly', () => {
    expect(isInScale(62, 'D')).toBe(true)
    expect(isInScale(63, 'D')).toBe(false)
  })
})

describe('snapToScale', () => {
  const cMajor = parseKey('C')

  it('leaves in-scale notes alone', () => {
    expect(snapToScale(60, cMajor)).toBe(60)
    expect(snapToScale(64, cMajor)).toBe(64)
  })

  it('snaps an out-of-scale note to the nearest scale note', () => {
    expect(snapToScale(61, cMajor)).toBe(60) // C#4 -> C4 (distance 1 each side, goes down)
    expect(snapToScale(70, cMajor)).toBe(69) // A#4 -> A4
    expect(snapToScale(66, cMajor)).toBe(65) // F#4 -> F4 (tie goes down)
  })

  it('always returns a note in the scale', () => {
    const scale = parseKey('F#m')
    for (let midi = 40; midi <= 90; midi++) {
      const snapped = snapToScale(midi, scale)
      expect(isInScale(snapped, scale)).toBe(true)
      expect(Math.abs(snapped - midi)).toBeLessThanOrEqual(1)
    }
  })

  it('does not throw on bad input', () => {
    expect(snapToScale(NaN, cMajor)).toBeNaN()
    expect(snapToScale(61, undefined)).toBe(60)
  })
})

describe('midiToFreq', () => {
  it('maps A4 to 440 Hz and an octave to a doubling', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 6)
    expect(midiToFreq(81)).toBeCloseTo(880, 6)
    expect(midiToFreq(57)).toBeCloseTo(220, 6)
  })
})
