import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useStrudel } from '../hooks/useStrudel'

afterEach(() => {
  delete window.initStrudel
  delete window.samples
  vi.restoreAllMocks()
})

describe('useStrudel integration', () => {
  it('transitions to ready when initStrudel resolves', async () => {
    window.samples = vi.fn()
    window.initStrudel = vi.fn().mockResolvedValue({
      evaluate: vi.fn(),
      stop: vi.fn(),
    })

    const { result } = renderHook(() => useStrudel())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    expect(result.current.ready).toBe(true)
    expect(result.current.error).toBe(null)
    expect(window.initStrudel).toHaveBeenCalledTimes(1)
  })

  it('reports an error instead of a fake ready engine when initStrudel rejects', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    window.samples = vi.fn()
    window.initStrudel = vi.fn().mockRejectedValue(new Error('init failed'))

    const { result } = renderHook(() => useStrudel())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    expect(result.current.ready).toBe(false)
    expect(result.current.error).toBe('init failed')
    await expect(result.current.play('s("bd")')).rejects.toThrow('Engine not ready')
  })

  it('recovers on retry once the engine loads', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    window.samples = vi.fn()
    window.initStrudel = vi
      .fn()
      .mockRejectedValueOnce(new Error('cdn down'))
      .mockResolvedValue({ evaluate: vi.fn(), stop: vi.fn() })

    const { result } = renderHook(() => useStrudel())
    await waitFor(() => expect(result.current.error).toBe('cdn down'))

    act(() => result.current.retry())

    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.error).toBe(null)
    expect(window.initStrudel).toHaveBeenCalledTimes(2)
  })
})
