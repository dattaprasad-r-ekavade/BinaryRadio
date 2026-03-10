import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import './Visualizer.css'

export default function Visualizer({ analyser, mode, playing }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf = null
    const w = () => canvas.clientWidth
    const h = () => canvas.clientHeight

    const freqData = analyser ? new Uint8Array(analyser.frequencyBinCount) : null
    const timeData = analyser ? new Uint8Array(analyser.fftSize) : null

    const drawFake = (t, fakeMode) => {
      const width = w()
      const height = h()
      ctx.clearRect(0, 0, width, height)
      if (fakeMode === 'waveform') {
        ctx.lineWidth = 2
        ctx.strokeStyle = '#00e87a'
        ctx.beginPath()
        const points = 120
        for (let i = 0; i < points; i += 1) {
          const x = (i / (points - 1)) * width
          const amp = Math.sin(t / 220 + i * 0.18) * 0.36 + Math.sin(t / 140 + i * 0.04) * 0.12
          const y = height * 0.5 + amp * (height * 0.45)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      } else {
        ctx.fillStyle = 'rgba(0,232,122,.22)'
        const bars = 30
        for (let i = 0; i < bars; i += 1) {
          const phase = t / 180 + i * 0.28
          const amp = (Math.sin(phase) + 1) * 0.5
          const bw = width / bars - 2
          const bh = amp * height * 0.9
          ctx.fillRect(i * (bw + 2), height - bh, bw, bh)
        }
      }
    }

    const lowEnd =
      (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4) ||
      (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4) ||
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const frameMs = lowEnd ? 1000 / 30 : 1000 / 60
    let lastTs = 0

    const draw = (t = 0) => {
      if (t - lastTs < frameMs) {
        raf = requestAnimationFrame(draw)
        return
      }
      lastTs = t

      const width = w()
      const height = h()
      canvas.width = width
      canvas.height = height
      ctx.clearRect(0, 0, width, height)

      if (!playing) {
        ctx.fillStyle = 'rgba(90,88,122,.22)'
        ctx.fillRect(0, height - 6, width, 6)
        raf = requestAnimationFrame(draw)
        return
      }

      if (!analyser || (!freqData && !timeData)) {
        drawFake(t, mode)
        raf = requestAnimationFrame(draw)
        return
      }

      if (mode === 'spectrum') {
        analyser.getByteFrequencyData(freqData)
        const bars = 56
        const step = Math.max(1, Math.floor(freqData.length / bars))
        const bw = width / bars
        for (let i = 0; i < bars; i += 1) {
          const v = freqData[i * step] / 255
          const bh = Math.max(2, v * height)
          ctx.fillStyle = i > 42 ? '#ff7a4b' : i > 28 ? '#ffb703' : '#00e87a'
          ctx.fillRect(i * bw + 1, height - bh, Math.max(1, bw - 2), bh)
        }
      } else {
        analyser.getByteTimeDomainData(timeData)
        ctx.lineWidth = 2
        ctx.strokeStyle = '#00e87a'
        ctx.beginPath()
        for (let i = 0; i < timeData.length; i += 1) {
          const x = (i / (timeData.length - 1)) * width
          const y = (timeData[i] / 255) * height
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [analyser, mode, playing])

  return <canvas ref={canvasRef} className="viz-canvas" aria-label="Audio visualizer" />
}

Visualizer.propTypes = {
  analyser: PropTypes.shape({
    fftSize: PropTypes.number,
    frequencyBinCount: PropTypes.number,
    getByteFrequencyData: PropTypes.func,
    getByteTimeDomainData: PropTypes.func,
  }),
  mode: PropTypes.oneOf(['spectrum', 'waveform']).isRequired,
  playing: PropTypes.bool.isRequired,
}
