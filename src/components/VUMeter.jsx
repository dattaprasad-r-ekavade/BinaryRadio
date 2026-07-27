import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import './VUMeter.css'

const SEGMENTS = 24
/** Segment index at which the meter turns amber / red. */
const AMBER_AT = 16
const RED_AT = 21
/** Ballistics: fast attack, slow release — standard for a peak-programme meter. */
const ATTACK = 0.55
const RELEASE = 0.08
/** How long the peak marker holds before it starts falling back, in frames. */
const PEAK_HOLD_FRAMES = 30
const PEAK_FALL = 0.012

/**
 * Level meter driven by a real per-channel AnalyserNode.
 *
 * Falls back to a flat, unlit meter when no analyser is available (before the
 * first PLAY, or on the graceful fallback engine) rather than animating fake
 * levels, which previously made a silent deck look like it was playing.
 */
/** @typedef {{ fftSize: number, getByteTimeDomainData: (data: Uint8Array) => void }} LevelSource */

export default function VUMeter({
  analyser = /** @type {LevelSource | null} */ (null),
  active,
  ch,
}) {
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const levelRef = useRef(0)
  const peakRef = useRef(0)
  const holdRef = useRef(0)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const segments = /** @type {HTMLElement[]} */ ([...root.querySelectorAll('.vu-b')])
    const peakEl = /** @type {HTMLElement | null} */ (root.querySelector('.vu-peak'))

    const paint = (level, peak) => {
      const lit = Math.round(level * SEGMENTS)
      for (let i = 0; i < segments.length; i += 1) {
        segments[i].classList.toggle('vu-b--on', i < lit)
      }
      if (peakEl) {
        peakEl.style.setProperty('--peak', String(Math.max(0, Math.min(1, peak))))
        peakEl.style.opacity = peak > 0.02 ? '1' : '0'
      }
    }

    if (!analyser || !active) {
      levelRef.current = 0
      peakRef.current = 0
      paint(0, 0)
      return undefined
    }

    const data = new Uint8Array(analyser.fftSize)
    let raf = 0

    const tick = () => {
      analyser.getByteTimeDomainData(data)

      /* RMS of the centred waveform, then a gentle curve so quiet material
         still moves the meter — a linear mapping barely lights one segment. */
      let sum = 0
      for (let i = 0; i < data.length; i += 1) {
        const v = (data[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.sqrt(sum / data.length)
      const target = Math.min(1, Math.pow(rms * 2.2, 0.65))

      const coeff = target > levelRef.current ? ATTACK : RELEASE
      levelRef.current += (target - levelRef.current) * coeff

      if (levelRef.current >= peakRef.current) {
        peakRef.current = levelRef.current
        holdRef.current = PEAK_HOLD_FRAMES
      } else if (holdRef.current > 0) {
        holdRef.current -= 1
      } else {
        peakRef.current = Math.max(0, peakRef.current - PEAK_FALL)
      }

      paint(levelRef.current, peakRef.current)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [analyser, active])

  return (
    <div className="vu" ref={rootRef}>
      <span className="vu-ch" aria-hidden="true">
        {ch}
      </span>
      <div className="vu-bars">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className="vu-b"
            data-zone={i >= RED_AT ? 'red' : i >= AMBER_AT ? 'amber' : 'green'}
          />
        ))}
        <span className="vu-peak" aria-hidden="true" />
      </div>
    </div>
  )
}

VUMeter.propTypes = {
  analyser: PropTypes.shape({
    fftSize: PropTypes.number,
    getByteTimeDomainData: PropTypes.func,
  }),
  active: PropTypes.bool.isRequired,
  ch: PropTypes.string.isRequired,
}
