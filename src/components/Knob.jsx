import { useRef } from 'react'
import PropTypes from 'prop-types'
import './Knob.css'

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

function arcSegment(cx, cy, r, startDeg, endDeg) {
  const toRad = (d) => (d * Math.PI) / 180
  const sx = cx + r * Math.sin(toRad(startDeg))
  const sy = cy - r * Math.cos(toRad(startDeg))
  const ex = cx + r * Math.sin(toRad(endDeg))
  const ey = cy - r * Math.cos(toRad(endDeg))
  const span = endDeg - startDeg
  if (Math.abs(span) < 0.5) return null
  const large = Math.abs(span) > 180 ? 1 : 0
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`
}

export default function Knob({
  value,
  min = 0,
  max = 1,
  onChange,
  trackColor = '#00e87a',
  glowColor = 'rgba(0,232,122,.6)',
  dragTitle,
  dragDirection = 1,
}) {
  const startY = useRef(null)
  const startVal = useRef(null)
  const span = max - min
  const step = Math.max(0.01, span / 100)
  const pct = (value - min) / (max - min)
  const deg = -135 + pct * 270
  const cx = 40
  const cy = 40
  const r = 28

  const bgArc = arcSegment(cx, cy, r, -135, 135)
  const fgArc = arcSegment(cx, cy, r, -135, deg)
  const indX = cx + 14 * Math.sin((deg * Math.PI) / 180)
  const indY = cy - 14 * Math.cos((deg * Math.PI) / 180)

  const startDrag = (clientY) => {
    startY.current = clientY
    startVal.current = value
  }
  const moveDrag = (clientY) => {
    const delta = (startY.current - clientY) / 260
    const next = clamp(startVal.current + delta * dragDirection * span, min, max)
    onChange(parseFloat(next.toFixed(2)))
  }

  const onKeyDown = (e) => {
    let next = value
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = value + step * dragDirection
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = value - step * dragDirection
    else if (e.key === 'PageUp') next = value + step * 5 * dragDirection
    else if (e.key === 'PageDown') next = value - step * 5 * dragDirection
    else if (e.key === 'Home') next = min
    else if (e.key === 'End') next = max
    else return

    e.preventDefault()
    onChange(parseFloat(clamp(next, min, max).toFixed(2)))
  }

  const onMouseDown = (e) => {
    startDrag(e.clientY)
    const onMove = (mv) => moveDrag(mv.clientY)
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    e.preventDefault()
  }

  const onTouchStart = (e) => {
    startDrag(e.touches[0].clientY)
    const onMove = (mv) => {
      mv.preventDefault()
      moveDrag(mv.touches[0].clientY)
    }
    const onEnd = () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    e.preventDefault()
  }

  return (
    <div
      className="knob-wrap"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onKeyDown={onKeyDown}
      title={dragTitle ?? 'Drag up/down'}
      role="slider"
      tabIndex={0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={value.toFixed(2)}
      aria-label={dragTitle ?? 'Knob control'}
    >
      <svg width="80" height="80" viewBox="0 0 80 80">
        {bgArc && (
          <path d={bgArc} fill="none" stroke="#1a1a28" strokeWidth="4.5" strokeLinecap="round" />
        )}
        {fgArc && (
          <path
            d={fgArc}
            fill="none"
            stroke={trackColor}
            strokeWidth="4.5"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}
          />
        )}
        <circle cx={cx} cy={cy} r="20" fill="#0e0e18" stroke="#2a2a3c" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="18" fill="#111120" stroke="#1e1e2e" strokeWidth="1" />
        <circle
          cx={indX.toFixed(2)}
          cy={indY.toFixed(2)}
          r="3.5"
          fill={trackColor}
          style={{ filter: `drop-shadow(0 0 5px ${trackColor})` }}
        />
      </svg>
    </div>
  )
}

Knob.propTypes = {
  value: PropTypes.number.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  trackColor: PropTypes.string,
  glowColor: PropTypes.string,
  dragTitle: PropTypes.string,
  dragDirection: PropTypes.number,
}
