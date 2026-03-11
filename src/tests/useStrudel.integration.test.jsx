import { renderHook, waitFor } from '@testing-library/react'
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

  it('falls back to a graceful engine when initStrudel rejects', async () => {
    window.samples = vi.fn()
    window.initStrudel = vi.fn().mockRejectedValue(new Error('init failed'))

    const { result } = renderHook(() => useStrudel())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    expect(result.current.ready).toBe(true)
    expect(result.current.error).toBe(null)
  })
})
