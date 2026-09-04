import { describe, expect, it } from 'vitest'
import {
  bpmToCps,
  extractSampleSelectors,
  isValidManifestTrack,
  normalizeTrack,
  preparePlaybackCode,
} from '../utils/tunePipeline'

describe('tune pipeline integration', () => {
  it('converts cassette BPM metadata to the engine clock', () => {
    expect(bpmToCps(102)).toBeCloseTo(0.425)
    expect(bpmToCps('84')).toBeCloseTo(0.35)
    expect(bpmToCps('unknown')).toBe(0.25)
    expect(bpmToCps(999)).toBe(1)
  })

  it('normalizes manifest track and prepares playback code/selectors', () => {
    const manifestTrack = {
      id: 'gentle-focus',
      title: 'Gentle Focus',
      file: '/tunes/gentle-focus.md',
      bpm: '84',
      moodTags: ['calm'],
    }
    expect(isValidManifestTrack(manifestTrack)).toBe(true)

    const normalized = normalizeTrack(manifestTrack)
    expect(normalized).toMatchObject({
      id: 'gentle-focus',
      title: 'Gentle Focus',
      key: 'Am',
      durationSec: 180,
      bpm: 84,
    })

    const raw = `setcps(0.25)\nstack([s("hh:2 ~ hh shaker:1"), s("bd:1")])`
    const { code, selectors } = preparePlaybackCode(raw)
    expect(code).not.toContain('setcps(')
    expect(selectors).toEqual(expect.arrayContaining(['hh:2', 'hh:0', 'shaker:1', 'bd:1']))
    expect(extractSampleSelectors(code)).toEqual(selectors)
  })
})
