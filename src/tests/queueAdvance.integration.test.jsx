import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const engine = {
  play: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn(),
}

vi.mock('../hooks/useStrudel', () => ({
  useStrudel: () => ({
    ready: true,
    initializing: false,
    error: null,
    retry: () => {},
    audioReady: false,
    play: engine.play,
    stop: engine.stop,
    setCps: () => {},
    setMasterVolume: () => false,
    setEq: () => false,
    getAnalyser: () => null,
    getChannelAnalysers: () => ({ left: null, right: null }),
    startWavCapture: async () => ({ ok: false }),
    stopWavCapture: async () => ({ ok: false }),
    canExportAudio: () => false,
    getExportDiagnostics: () => ({}),
    warmup: async () => {},
  }),
}))

const { usePlayerState } = await import('../hooks/usePlayerState')

beforeEach(() => {
  // shouldAdvanceTime keeps waitFor polling while letting us jump a whole tape ahead.
  vi.useFakeTimers({ shouldAdvanceTime: true })
  localStorage.clear()
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => null, text: async () => 's("bd")' })),
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  engine.play.mockClear()
  engine.stop.mockClear()
})

async function startFirstTape(result) {
  const [first] = result.current.library.tracks
  await act(async () => {
    result.current.transport.actions.radioLoad(first)
  })
  await waitFor(() => expect(result.current.transport.loadedCode).toBeTruthy())
  await act(async () => {
    await result.current.transport.actions.play()
  })
  expect(result.current.transport.deckState).toBe('playing')
  return first
}

describe('queue auto-advance', () => {
  it('plays the next queued tape at the end of the current one, even with LOOP on', async () => {
    const { result } = renderHook(() => usePlayerState())
    const first = await startFirstTape(result)
    expect(result.current.transport.looping).toBe(true)

    const second = result.current.library.tracks[1]
    act(() => result.current.library.actions.queueTrack(second.id))

    await act(async () => {
      vi.advanceTimersByTime((first.durationSec || 180) * 1000 + 10)
    })

    await waitFor(() => expect(result.current.transport.loadedTrack.id).toBe(second.id))
    expect(result.current.queue.tracks).toHaveLength(0)
  })

  it('stops at the end of the tape when LOOP is off and nothing is queued', async () => {
    const { result } = renderHook(() => usePlayerState())
    const first = await startFirstTape(result)
    act(() => result.current.transport.actions.toggleLooping())

    await act(async () => {
      vi.advanceTimersByTime((first.durationSec || 180) * 1000 + 10)
    })

    expect(result.current.transport.deckState).toBe('stopped')
  })
})
