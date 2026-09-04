// @ts-nocheck — canvas/analyser refs; typed migration tracked in issue #TS-001
import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { readThemeColors } from '../utils/themeColors'
import './Visualizer.css'

/** Bars in spectrum mode. Fixed count keeps bar width stable across widths. */
const SPECTRUM_BARS = 56
/** Bars used by the idle/no-analyser animation. */
const IDLE_BARS = 40
/** Smoothing factor applied to bar heights so the spectrum doesn't strobe. */
const SMOOTHING = 0.55

export default function Visualizer({ analyser, mode, playing }) {
  const canvasRef = useRef(null)
  const levelsRef = useRef(new Float32Array(SPECTRUM_BARS))
  const [themeColors, setThemeColors] = useState(readThemeColors)

  useEffect(() => {
    const sync = () => setThemeColors(readThemeColors())
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx || typeof ctx.setTransform !== 'function') return
    let raf = null

    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const freqData = analyser ? new Uint8Array(analyser.frequencyBinCount) : null
    const timeData = analyser ? new Uint8Array(analyser.fftSize) : null

    /** Horizontal rules + centre line, so the panel reads as an instrument
     *  screen rather than an empty black rectangle when nothing is playing. */
    const drawGrid = (width, height) => {
      ctx.strokeStyle = themeColors.vizGrid
      ctx.lineWidth = 1
      for (let i = 1; i < 4; i += 1) {
        const y = Math.round((height / 4) * i) + 0.5
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
    }

    /** Idle: a slow, low-amplitude standby trace. Replaces the previous
     *  6px flat bar, which read as a rendering failure. */
    const drawIdle = (t, width, height) => {
      drawGrid(width, height)
      ctx.strokeStyle = themeColors.vizIdle
      ctx.lineWidth = 1.5
      ctx.beginPath()
      const mid = height / 2
      const points = 160
      for (let i = 0; i <= points; i += 1) {
        const x = (i / points) * width
        const phase = reducedMotion ? 0 : t / 900
        const amp =
          Math.sin(i * 0.09 + phase) * 0.32 +
          Math.sin(i * 0.021 - phase * 0.6) * 0.5 +
          Math.sin(i * 0.004 + phase * 1.7) * 0.18
        const y = mid + amp * (height * 0.11)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    /** Playing but no analyser (fallback engine / autoplay blocked). */
    const drawFake = (t, fakeMode, width, height) => {
      drawGrid(width, height)
      if (fakeMode === 'waveform') {
        ctx.lineWidth = 2
        ctx.strokeStyle = themeColors.green
        ctx.beginPath()
        const points = 140
        for (let i = 0; i <= points; i += 1) {
          const x = (i / points) * width
          const amp = Math.sin(t / 220 + i * 0.18) * 0.36 + Math.sin(t / 140 + i * 0.04) * 0.12
          const y = height * 0.5 + amp * (height * 0.42)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      } else {
        ctx.fillStyle = themeColors.vizFill
        const gap = 2
        const bw = width / IDLE_BARS - gap
        for (let i = 0; i < IDLE_BARS; i += 1) {
          const phase = t / 180 + i * 0.28
          const amp = (Math.sin(phase) + 1) * 0.5 * (1 - i / (IDLE_BARS * 1.6))
          const bh = Math.max(2, amp * height * 0.85)
          ctx.fillRect(i * (bw + gap), height - bh, bw, bh)
        }
      }
    }

    const lowEnd =
      (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4) ||
      (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4)
    // Idle animation is decorative, so keep it inexpensive. Reduced-motion
    // users receive an almost-static trace while active playback stays fluid.
    const frameMs = reducedMotion ? 1000 : playing ? (lowEnd ? 1000 / 30 : 1000 / 60) : 1000 / 15
    let lastTs = 0

    const draw = (t = 0) => {
      raf = requestAnimationFrame(draw)
      if (t - lastTs < frameMs) return
      lastTs = t

      /* Match the backing store to the CSS box *and* devicePixelRatio, so the
         trace is crisp on HiDPI instead of the previous 1x upscale. */
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      if (!playing) {
        drawIdle(t, width, height)
        return
      }

      if (!analyser || (!freqData && !timeData)) {
        drawFake(t, mode, width, height)
        return
      }

      drawGrid(width, height)

      if (mode === 'spectrum') {
        analyser.getByteFrequencyData(freqData)
        const step = Math.max(1, Math.floor(freqData.length / SPECTRUM_BARS))
        const gap = width > 420 ? 2 : 1
        const bw = width / SPECTRUM_BARS
        const levels = levelsRef.current
        for (let i = 0; i < SPECTRUM_BARS; i += 1) {
          const v = freqData[i * step] / 255
          levels[i] = levels[i] * SMOOTHING + v * (1 - SMOOTHING)
          const bh = Math.max(2, levels[i] * height * 0.95)
          ctx.fillStyle =
            i > 42 ? themeColors.vizHot : i > 28 ? themeColors.vizMid : themeColors.green
          ctx.fillRect(i * bw, height - bh, Math.max(1, bw - gap), bh)
        }
      } else {
        analyser.getByteTimeDomainData(timeData)
        ctx.lineWidth = 2
        ctx.strokeStyle = themeColors.green
        ctx.lineJoin = 'round'
        ctx.beginPath()
        /* Time-domain data is centred on 128; map it around the vertical
           midpoint so a silent signal is a flat centre line (it was previously
           mapped to 0..height, pinning silence to the middle only by luck). */
        for (let i = 0; i < timeData.length; i += 1) {
          const x = (i / (timeData.length - 1)) * width
          const y = height / 2 + ((timeData[i] - 128) / 128) * (height * 0.45)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    }

    raf = requestAnimationFrame(draw)
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [analyser, mode, playing, themeColors])

  return (
    <canvas
      ref={canvasRef}
      className="viz-canvas"
      role="img"
      aria-label={playing ? `Audio ${mode} visualizer` : 'Audio visualizer, idle'}
    />
  )
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
