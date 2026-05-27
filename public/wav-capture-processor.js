/**
 * AudioWorklet processor for WAV capture.
 * Passes audio through to the output while forwarding each buffer
 * to the main thread for encoding.
 */
class WavCaptureProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0]
    const output = outputs[0]
    if (input && input.length > 0) {
      const left = input[0] || new Float32Array(128)
      const right = input[1] || left

      // Pass audio through so downstream nodes (destination) still receive it.
      if (output) {
        if (output[0]) output[0].set(left)
        if (output[1]) output[1].set(right)
      }

      // Transfer ownership to avoid a copy on the main thread.
      const leftCopy = left.slice()
      const rightCopy = right.slice()
      this.port.postMessage(
        { left: leftCopy, right: rightCopy },
        [leftCopy.buffer, rightCopy.buffer],
      )
    }
    return true
  }
}

registerProcessor('wav-capture-processor', WavCaptureProcessor)
