import { describe, it, expect } from 'vitest'
import { groupTracksByMood, bargainBinTracks } from '../utils/shelving'

const track = (id, ...moodTags) => ({ id, title: id, moodTags })

describe('groupTracksByMood', () => {
  it('returns no sections when no track has a mood', () => {
    expect(groupTracksByMood([track('a'), track('b', 'v2')])).toEqual([])
    expect(groupTracksByMood([])).toEqual([])
  })

  it('ignores v2 and uses the first remaining tag as the mood', () => {
    const tracks = [track('a', 'v2', 'rain'), track('b', 'rain', 'v2'), track('c', 'lofi')]
    const sections = groupTracksByMood(tracks, 3)
    expect(sections.map((s) => s.tag)).toEqual(['rain', 'lofi'])
    expect(sections[0].tracks.map((t) => t.id)).toEqual(['a', 'b'])
  })

  it('orders sections by count desc, then first appearance', () => {
    const tracks = [
      track('1', 'x'),
      track('2', 'y'),
      track('3', 'y'),
      track('4', 'z'),
      track('5', 'z'),
    ]
    const sections = groupTracksByMood(tracks, 3)
    expect(sections.map((s) => s.tag)).toEqual(['y', 'z', 'x'])
  })

  it('breaks count ties by first appearance', () => {
    const tracks = [track('1', 'b'), track('2', 'a')]
    expect(groupTracksByMood(tracks, 3).map((s) => s.tag)).toEqual(['b', 'a'])
  })

  it('uppercases the label', () => {
    const [section] = groupTracksByMood([track('a', 'synthwave')])
    expect(section.label).toBe('SYNTHWAVE')
  })

  it('caps sections at maxSections and appends leftovers to the smallest section', () => {
    const tracks = [
      track('a1', 'a'),
      track('a2', 'a'),
      track('a3', 'a'),
      track('b1', 'b'),
      track('b2', 'b'),
      track('c1', 'c'),
      track('d1', 'd'), // only mood left out (count 1, last seen)
    ]
    const sections = groupTracksByMood(tracks, 3)
    expect(sections.map((s) => s.tag)).toEqual(['a', 'b', 'c'])
    // c has 1 track and is the smallest, so d1 (leftover) lands there
    expect(sections.map((s) => s.tracks.map((t) => t.id))).toEqual([
      ['a1', 'a2', 'a3'],
      ['b1', 'b2'],
      ['c1', 'd1'],
    ])
  })

  it('places tracks with no mood into the smallest section', () => {
    const tracks = [track('a1', 'a'), track('a2', 'a'), track('b1', 'b'), track('none')]
    const sections = groupTracksByMood(tracks, 3)
    expect(sections).toHaveLength(2)
    expect(sections[1].tracks.map((t) => t.id)).toEqual(['b1', 'none'])
  })

  it('gives exactly min(maxSections, distinct moods) sections', () => {
    const tracks = [track('1', 'a'), track('2', 'b')]
    expect(groupTracksByMood(tracks, 3)).toHaveLength(2)
    expect(groupTracksByMood(tracks, 1)).toHaveLength(1)
    expect(groupTracksByMood(tracks, 0)).toHaveLength(0)
  })

  it('keeps every track exactly once', () => {
    const tracks = Array.from({ length: 24 }, (_, i) => track(`t${i}`, `mood${i % 7}`))
    const sections = groupTracksByMood(tracks, 3)
    const ids = sections.flatMap((s) => s.tracks.map((t) => t.id)).sort()
    expect(ids).toEqual(tracks.map((t) => t.id).sort())
  })

  it('does not mutate its input', () => {
    const tracks = [track('a', 'x'), track('b', 'y')]
    const snapshot = JSON.stringify(tracks)
    groupTracksByMood(tracks, 3)
    expect(JSON.stringify(tracks)).toBe(snapshot)
  })
})

describe('bargainBinTracks', () => {
  const tracks = Array.from({ length: 24 }, (_, i) => track(`t${i}`, 'm'))
  const ids = (list) => list.map((t) => t.id)

  it('returns count distinct tracks drawn from the input', () => {
    const picked = bargainBinTracks(tracks, 8)
    expect(picked).toHaveLength(8)
    expect(new Set(ids(picked)).size).toBe(8)
    for (const t of picked) expect(tracks).toContain(t)
  })

  it('is deterministic for the same seed', () => {
    expect(ids(bargainBinTracks(tracks, 8, 5))).toEqual(ids(bargainBinTracks(tracks, 8, 5)))
  })

  it('changes with the seed', () => {
    expect(ids(bargainBinTracks(tracks, 8, 1))).not.toEqual(ids(bargainBinTracks(tracks, 8, 2)))
  })

  it('returns all tracks when count exceeds the list, without duplicates', () => {
    const picked = bargainBinTracks(tracks.slice(0, 3), 8)
    expect(picked).toHaveLength(3)
    expect(new Set(ids(picked)).size).toBe(3)
  })

  it('handles empty input and non-positive counts', () => {
    expect(bargainBinTracks([], 8)).toEqual([])
    expect(bargainBinTracks(tracks, 0)).toEqual([])
    expect(bargainBinTracks(tracks, -2)).toEqual([])
    expect(bargainBinTracks(tracks, NaN)).toEqual([])
  })

  it('does not mutate its input', () => {
    const copy = tracks.slice()
    bargainBinTracks(tracks, 8)
    expect(tracks).toEqual(copy)
  })
})

describe('groupTracksIntoSections', () => {
  it('files every manifest tape in a section that matches one of its moods', async () => {
    const { default: manifest } = await import('../../public/tunes/manifest.json')
    const { groupTracksIntoSections, SHOP_SECTIONS } = await import('../utils/shelving')
    const sections = groupTracksIntoSections(manifest)
    expect(sections.map((s) => s.label)).toEqual(SHOP_SECTIONS.map((s) => s.label))
    expect(sections.reduce((n, s) => n + s.tracks.length, 0)).toBe(manifest.length)
    sections.forEach((section, i) => {
      const allowed = new Set(SHOP_SECTIONS[i].tags)
      for (const t of section.tracks) expect(t.moodTags.some((m) => allowed.has(m))).toBe(true)
    })
    const where = (id) => sections.find((s) => s.tracks.some((t) => t.id === id))?.label
    expect(where('gentle-focus')).toBe('AMBIENT')
    expect(where('midnight-drive')).toBe('NIGHT & BEATS')
    expect(where('monsoon')).toBe('WORLD')
    expect(where('moonlit-local')).toBe('WORLD')
    expect(where('lantern-procession')).toBe('WORLD')
  })

  it('puts tapes with unknown moods in the smallest section', async () => {
    const { groupTracksIntoSections } = await import('../utils/shelving')
    const sections = groupTracksIntoSections([
      { id: 'a', moodTags: ['ambient'] },
      { id: 'b', moodTags: ['synthwave'] },
      { id: 'c', moodTags: ['mystery'] },
    ])
    expect(sections.find((s) => s.tracks.some((t) => t.id === 'c'))?.label).toBe('WORLD')
  })
})
