import { resolvePublicUrl } from './publicUrl'

const SAMPLE_CALL_RE = /\bs\((['"])([\s\S]*?)\1\)/g
const SAMPLE_TOKEN_RE = /\b([a-zA-Z][a-zA-Z0-9_-]*)(?::(\d+))?\b/g

export function bpmToCps(bpm, fallbackCps = 0.25) {
  const numericBpm = Number(bpm)
  const cps = Number.isFinite(numericBpm) && numericBpm > 0 ? numericBpm / 240 : fallbackCps
  return Math.max(0.05, Math.min(1, cps))
}

export function normalizeTrack(track, index = 0) {
  const file =
    track.file && !/^https?:\/\//i.test(track.file) ? resolvePublicUrl(track.file) : track.file
  return {
    ...track,
    file,
    title: track.title || `Untitled ${index + 1}`,
    description: track.description || 'Custom tune',
    color: track.color || '#1b3a60',
    accent: track.accent || '#4a88dd',
    emoji: track.emoji || '🎵',
    bpm: Number(track.bpm) || 96,
    key: track.key || 'Am',
    moodTags: Array.isArray(track.moodTags) ? track.moodTags : ['ambient'],
    durationSec: Number(track.durationSec) || 180,
  }
}

export function isValidManifestTrack(track) {
  return !!(
    track &&
    typeof track === 'object' &&
    typeof track.id === 'string' &&
    track.id.trim() &&
    typeof track.title === 'string' &&
    track.title.trim() &&
    typeof track.file === 'string' &&
    track.file.trim()
  )
}

export function extractSampleSelectors(code) {
  if (typeof code !== 'string' || !code.includes('s(')) return []

  const out = new Set()
  SAMPLE_CALL_RE.lastIndex = 0
  let match
  while ((match = SAMPLE_CALL_RE.exec(code))) {
    const pat = match[2]
    SAMPLE_TOKEN_RE.lastIndex = 0
    let token
    while ((token = SAMPLE_TOKEN_RE.exec(pat))) {
      const name = token[1]
      const idx = token[2] ?? '0'
      out.add(`${name}:${idx}`)
    }
  }
  return [...out]
}

export function preparePlaybackCode(rawCode) {
  const code = String(rawCode || '').replace(/^setcps\([^)]*\)\n?/m, '')
  return {
    code,
    selectors: extractSampleSelectors(code),
  }
}
