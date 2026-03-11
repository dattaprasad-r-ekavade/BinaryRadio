import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRadioMode } from '../hooks/useRadioMode'
import { playAnnouncementIfAvailable } from '../rj/playAnnouncement'

vi.mock('../rj/playAnnouncement', () => ({
  playAnnouncementIfAvailable: vi.fn(),
}))

const tracks = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B' },
]

describe('useRadioMode integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('flows idle -> playing -> announcing -> playing(next)', async () => {
    const onLoadAndPlay = vi.fn()
    const onStop = vi.fn()

    let resolveAnnouncement
    const playAnnouncementMock = /** @type {import('vitest').Mock} */ (playAnnouncementIfAvailable)
    playAnnouncementMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAnnouncement = resolve
        }),
    )

    const { result } = renderHook(() =>
      useRadioMode({
        tracks,
        onLoadAndPlay,
        onStop,
        rjVolume: 0.5,
      }),
    )

    act(() => {
      result.current.toggle(0)
    })

    expect(result.current.enabled).toBe(true)
    expect(result.current.phase).toBe('playing')
    expect(onLoadAndPlay).toHaveBeenNthCalledWith(1, tracks[0])

    await act(async () => {
      vi.advanceTimersByTime(300000)
      await Promise.resolve()
    })

    expect(onStop).toHaveBeenCalled()
    expect(result.current.phase).toBe('announcing')
    expect(playAnnouncementMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveAnnouncement()
      await Promise.resolve()
    })

    expect(result.current.phase).toBe('playing')
    expect(onLoadAndPlay).toHaveBeenNthCalledWith(2, tracks[1])
  })
})
