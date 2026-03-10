import { describe, expect, it } from 'vitest'
import {
  extractSampleSelectors,
  isValidManifestTrack,
  normalizeTrack,
  preparePlaybackCode,
} from '../utils/tunePipeline'

describe('tune pipeline integration', () => {
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
