import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolvePublicUrl } from '../utils/publicUrl'

describe('resolvePublicUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('prefixes root-relative paths with the Vite base URL', () => {
    vi.stubEnv('BASE_URL', '/BinaryRadio/')
    expect(resolvePublicUrl('/tunes/gentle-focus.md')).toBe('/BinaryRadio/tunes/gentle-focus.md')
    expect(resolvePublicUrl('wav-capture-processor.js')).toBe(
      '/BinaryRadio/wav-capture-processor.js',
    )
  })

  it('leaves absolute http(s) URLs unchanged', () => {
    vi.stubEnv('BASE_URL', '/BinaryRadio/')
    const url = 'https://example.com/tune.md'
    expect(resolvePublicUrl(url)).toBe(url)
  })
})
