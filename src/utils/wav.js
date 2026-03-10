export function encodeStereoWavBuffer(chunks, sampleRate = 44100) {
  if (!Array.isArray(chunks) || !chunks.length) return null

  let total = 0
  for (const c of chunks) total += c.left.length

  const interleaved = new Float32Array(total * 2)
  let offset = 0
  for (const c of chunks) {
    for (let i = 0; i < c.left.length; i += 1) {
      interleaved[offset++] = c.left[i]
      interleaved[offset++] = c.right[i]
    }
  }

  const bytesPerSample = 2
  const blockAlign = 2 * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = interleaved.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const writeString = (o, s) => {
    for (let i = 0; i < s.length; i += 1) view.setUint8(o + i, s.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 2, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  let pos = 44
  for (let i = 0; i < interleaved.length; i += 1) {
    const s = Math.max(-1, Math.min(1, interleaved[i]))
    view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    pos += 2
  }

  return buffer
}

export function encodeStereoWav(chunks, sampleRate = 44100) {
  const buffer = encodeStereoWavBuffer(chunks, sampleRate)
  if (!buffer) return null
  return new Blob([new Uint8Array(buffer)], { type: 'audio/wav' })
}
