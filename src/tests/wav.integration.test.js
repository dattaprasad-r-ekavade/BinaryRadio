// @ts-nocheck — test utilities; typed migration tracked in issue #TS-001
import { describe, expect, it } from 'vitest'
import { encodeStereoWav, encodeStereoWavBuffer } from '../utils/wav'

function readAscii(view, offset, length) {
  let s = ''
  for (let i = 0; i < length; i += 1) s += String.fromCharCode(view.getUint8(offset + i))
  return s
}

describe('wav export integration', () => {
  it('produces a valid RIFF/WAVE header', async () => {
    const buffer = encodeStereoWavBuffer(
      [
        {
          left: new Float32Array([0, 0.5, -0.5]),
          right: new Float32Array([0, 0.25, -0.25]),
        },
      ],
      44100,
    )

    expect(buffer).toBeTruthy()
    const view = new DataView(buffer)

    const blob = encodeStereoWav(
      [
        {
          left: new Float32Array([0, 0.5, -0.5]),
          right: new Float32Array([0, 0.25, -0.25]),
        },
      ],
      44100,
    )
    expect(blob.type).toBe('audio/wav')
    expect(readAscii(view, 0, 4)).toBe('RIFF')
    expect(readAscii(view, 8, 4)).toBe('WAVE')
    expect(readAscii(view, 12, 4)).toBe('fmt ')
    expect(readAscii(view, 36, 4)).toBe('data')
    expect(view.getUint16(22, true)).toBe(2)
    expect(view.getUint32(24, true)).toBe(44100)
  })
})
