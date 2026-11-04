import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildAnnouncementText, playAnnouncementIfAvailable } from '../rj/playAnnouncement'

const cur = { id: 'midnight-drive', title: 'Midnight Drive' }
const next = { id: 'midnight-drive-v2', title: 'Midnight Drive v2', description: 'Synthwave' }

let spoken
beforeEach(() => {
  spoken = []
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => [{ lang: 'en-US', name: 'Test' }],
    cancel: vi.fn(),
    speak: vi.fn((u) => {
      spoken.push(u)
      setTimeout(() => u.onend?.(), 0)
    }),
  })
  vi.stubGlobal('SpeechSynthesisUtterance', function Utterance(text) {
    this.text = text
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('playAnnouncementIfAvailable', () => {
  it('speaks a generated line when no MP3 exists for the transition', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const result = await playAnnouncementIfAvailable(cur, next, { volume: 0.5 })
    expect(result).toBe(true)
    expect(spoken).toHaveLength(1)
    expect(spoken[0].text).toContain('Midnight Drive v2')
    expect(spoken[0].volume).toBe(0.5)
  })

  it('treats an HTML fallback page as a missing clip', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, headers: { get: () => 'text/html' } }),
    )
    await playAnnouncementIfAvailable(cur, next)
    expect(spoken).toHaveLength(1)
  })

  it('returns false without TTS support and no clip', async () => {
    vi.stubGlobal('speechSynthesis', undefined)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    await expect(playAnnouncementIfAvailable(cur, next)).resolves.toBe(false)
  })

  it('stays silent when RJ volume is zero', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(playAnnouncementIfAvailable(cur, next, { volume: 0 })).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('builds the same line for the same pair', () => {
    expect(buildAnnouncementText(cur, next)).toBe(buildAnnouncementText(cur, next))
  })
})
