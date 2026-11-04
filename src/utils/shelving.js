/**
 * Pure helpers for placing tapes in the 3D shop. No three.js here, so these
 * are unit-tested directly (src/tests/shelving.test.js).
 */

/** Tag that marks a tape's era/format rather than its mood; never a section. */
const IGNORED_TAG = 'v2'

/** A track's mood: its first moodTags entry that is not the ignored tag. */
export function primaryMood(track) {
  return (track.moodTags || []).find((tag) => tag !== IGNORED_TAG)
}

/**
 * Split tracks into at most `maxSections` mood sections for the shelf bays.
 *
 * - Sections are the most common primary moods (count desc, then first
 *   appearance in `tracks`), so the result has exactly
 *   min(maxSections, distinct primary moods) sections.
 * - A track joins the section for its primary mood. Tracks whose mood did not
 *   make the cut (or that have no mood at all) are appended, in input order, to
 *   whichever section has the fewest tracks at that point (first one on a tie).
 * - When no track has a mood, there are no sections and the result is [].
 *
 * @returns {{ tag: string, label: string, tracks: object[] }[]}
 */
export function groupTracksByMood(tracks, maxSections = 3) {
  const counts = new Map()
  const firstSeen = new Map()
  tracks.forEach((track, index) => {
    const tag = primaryMood(track)
    if (tag === undefined) return
    counts.set(tag, (counts.get(tag) || 0) + 1)
    if (!firstSeen.has(tag)) firstSeen.set(tag, index)
  })

  const limit = Math.max(0, Math.floor(maxSections))
  const chosen = [...counts.keys()]
    .sort((a, b) => counts.get(b) - counts.get(a) || firstSeen.get(a) - firstSeen.get(b))
    .slice(0, limit)

  const sections = chosen.map((tag) => ({ tag, label: tag.toUpperCase(), tracks: [] }))
  if (sections.length === 0) return []
  const sectionIndex = new Map(chosen.map((tag, i) => [tag, i]))

  const leftovers = []
  for (const track of tracks) {
    const i = sectionIndex.get(primaryMood(track))
    if (i === undefined) leftovers.push(track)
    else sections[i].tracks.push(track)
  }

  for (const track of leftovers) {
    let smallest = 0
    for (let i = 1; i < sections.length; i++) {
      if (sections[i].tracks.length < sections[smallest].tracks.length) smallest = i
    }
    sections[smallest].tracks.push(track)
  }

  return sections
}

/** Small deterministic PRNG (mulberry32). Returns floats in [0, 1). */
function seededRandom(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Pick up to `count` distinct tracks for the bargain bin. The same inputs
 * always give the same tracks, so the bin does not reshuffle on re-render.
 * Uses a partial Fisher-Yates shuffle on a copy of the list.
 */
export function bargainBinTracks(tracks, count = 8, seed = 1) {
  const wanted = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
  const n = Math.min(wanted, tracks.length)
  const pool = tracks.slice()
  const random = seededRandom(seed)
  const picked = []
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(random() * (pool.length - i))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
    picked.push(pool[i])
  }
  return picked
}
