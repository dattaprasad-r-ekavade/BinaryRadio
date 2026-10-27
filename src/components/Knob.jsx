import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import './Knob.css'

/** Sweep of the knob, in degrees, centred on 12 o'clock. */
const SWEEP = 270
const START_DEG = -SWEEP / 2
/** Pixels of straight drag (up or right) required to travel the full range. */
const DRAG_TRAVEL = 160
/** Held Shift divides the drag rate for fine adjustment. */
const FINE_FACTOR = 5
/** Closer to the centre than this, the pointer angle jumps too much to follow. */
const MIN_ROTATE_RADIUS = 12
/** Pixels of movement before a drag commits to turning or straight dragging. */
const MODE_PICK_DISTANCE = 4

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

/** Pointer angle around a centre, in degrees clockwise from 12 o'clock. */
function angleOf(cx, cy, x, y) {
  return (Math.atan2(x - cx, cy - y) * 180) / Math.PI
}

/** Smallest signed difference between two angles, in -180..180. */
function angleDelta(from, to) {
  return ((((to - from) % 360) + 540) % 360) - 180
}

function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180
  return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)]
}

function arcSegment(cx, cy, r, startDeg, endDeg) {
  const [sx, sy] = polar(cx, cy, r, startDeg)
  const [ex, ey] = polar(cx, cy, r, endDeg)
  const sweep = endDeg - startDeg
  if (Math.abs(sweep) < 0.5) return null
  const large = Math.abs(sweep) > 180 ? 1 : 0
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`
}

/** Evenly spaced scale marks around the arc. */
const TICKS = Array.from({ length: 11 }, (_, i) => START_DEG + (i / 10) * SWEEP)
/** Knurl lines on the knob face. */
const GRIPS = Array.from({ length: 24 }, (_, i) => (i / 24) * 360)

export default function Knob({
  value,
  min = 0,
  max = 1,
  onChange,
  trackColor = 'var(--green)',
  glowColor = 'var(--green-glow)',
  label = 'Knob control',
  valueText,
  dragDirection = 1,
}) {
  const wrapRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  /* Drag state: last pointer position and angle, plus the unrounded value so
     small moves accumulate instead of being lost to the 2-decimal rounding. */
  const drag = useRef(
    /** @type {{ x: number, y: number, cx: number, cy: number, angle: number, val: number, mode: 'rotary' | 'linear' | null } | null} */ (
      null
    ),
  )
  const range = max - min
  const step = Math.max(0.01, range / 100)
  const pct = clamp((value - min) / range, 0, 1)
  const deg = START_DEG + pct * SWEEP
  const cx = 40
  const cy = 40
  const r = 28

  const bgArc = arcSegment(cx, cy, r, START_DEG, START_DEG + SWEEP)
  const fgArc = arcSegment(cx, cy, r, START_DEG, deg)
  const [indX, indY] = polar(cx, cy, 14, deg)

  const commit = (next) => onChange(parseFloat(clamp(next, min, max).toFixed(2)))

  const centre = () => {
    const rect = wrapRef.current?.getBoundingClientRect()
    return rect ? [rect.left + rect.width / 2, rect.top + rect.height / 2] : [0, 0]
  }

  const startDrag = (clientX, clientY) => {
    const [kx, ky] = centre()
    drag.current = {
      x: clientX,
      y: clientY,
      cx: kx,
      cy: ky,
      angle: angleOf(kx, ky, clientX, clientY),
      val: value,
      mode: null,
    }
  }

  /* Two gestures turn the knob: circling it (clockwise = up) and dragging in a
     straight line (up or right = up). The first few pixels of movement pick
     one for the whole drag: moving around the centre from off-centre rotates,
     anything else is a straight drag. Mixing them per move made the two fight
     (a rightward drag below the knob is also a counter-clockwise turn). */
  const moveDrag = (clientX, clientY, fine) => {
    const d = drag.current
    if (!d) return
    if (!d.mode) {
      const mx = clientX - d.x
      const my = clientY - d.y
      if (Math.hypot(mx, my) < MODE_PICK_DISTANCE) return
      const rx = d.x - d.cx
      const ry = d.y - d.cy
      const rLen = Math.hypot(rx, ry)
      const tangential = rLen ? Math.abs(rx * my - ry * mx) / rLen : 0
      const radial = rLen ? Math.abs(rx * mx + ry * my) / rLen : Infinity
      d.mode = rLen > MIN_ROTATE_RADIUS && tangential > radial ? 'rotary' : 'linear'
    }
    const rate = fine ? FINE_FACTOR : 1
    const angle = angleOf(d.cx, d.cy, clientX, clientY)
    const delta =
      d.mode === 'rotary'
        ? angleDelta(d.angle, angle) / (SWEEP * rate)
        : ((clientX - d.x - (clientY - d.y)) / (DRAG_TRAVEL * rate)) * dragDirection
    d.val = clamp(d.val + delta * range, min, max)
    d.x = clientX
    d.y = clientY
    d.angle = angle
    commit(d.val)
  }

  const endDrag = () => {
    drag.current = null
  }

  /* React registers wheel listeners as passive, so the page would scroll
     while the knob turns. A native listener can cancel that. */
  const wheelState = useRef({ value, step, commit })
  useEffect(() => {
    wheelState.current = { value, step, commit }
  })
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return undefined
    const onWheel = (e) => {
      e.preventDefault()
      const { value: v, step: s, commit: c } = wheelState.current
      const direction = e.deltaY > 0 ? -1 : 1
      c(v + direction * s * (e.shiftKey ? 1 : 3) * dragDirection)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [dragDirection])

  const onKeyDown = (e) => {
    const big = e.shiftKey ? 5 : 1
    let next = value
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = value + step * big * dragDirection
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = value - step * big * dragDirection
    else if (e.key === 'PageUp') next = value + step * 10 * dragDirection
    else if (e.key === 'PageDown') next = value - step * 10 * dragDirection
    else if (e.key === 'Home') next = min
    else if (e.key === 'End') next = max
    else return

    e.preventDefault()
    commit(next)
  }

  const onMouseDown = (e) => {
    startDrag(e.clientX, e.clientY)
    const onMove = (mv) => moveDrag(mv.clientX, mv.clientY, mv.shiftKey)
    const onUp = () => {
      endDrag()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    e.preventDefault()
  }

  const onTouchStart = (e) => {
    startDrag(e.touches[0].clientX, e.touches[0].clientY)
    const onMove = (mv) => {
      mv.preventDefault()
      moveDrag(mv.touches[0].clientX, mv.touches[0].clientY, false)
    }
    const onEnd = () => {
      endDrag()
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    e.preventDefault()
  }

  return (
    <div
      ref={wrapRef}
      className="knob-wrap"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onKeyDown={onKeyDown}
      title={`${label} — turn, drag, scroll or use arrow keys (hold Shift for fine control)`}
      role="slider"
      tabIndex={0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText ?? value.toFixed(2)}
      aria-label={label}
      aria-orientation="vertical"
    >
      <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
        {/* Scale marks — give the control a readable range at a glance. */}
        {TICKS.map((t) => {
          const [x1, y1] = polar(cx, cy, 33, t)
          const [x2, y2] = polar(cx, cy, 36, t)
          return (
            <line
              key={t}
              x1={x1.toFixed(2)}
              y1={y1.toFixed(2)}
              x2={x2.toFixed(2)}
              y2={y2.toFixed(2)}
              stroke="var(--knob-track-bg)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          )
        })}
        {bgArc && (
          <path
            d={bgArc}
            fill="none"
            stroke="var(--knob-track-bg)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
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
        <circle
          cx={cx}
          cy={cy}
          r="20"
          fill="var(--knob-face)"
          stroke="var(--knob-face-stroke)"
          strokeWidth="2"
        />
        <circle
          cx={cx}
          cy={cy}
          r="18"
          fill="var(--knob-face-inner)"
          stroke="var(--knob-face-inner-stroke)"
          strokeWidth="1"
        />
        {/* Knurled grip — the plain disc read as a flat circle rather than a
            physical control. */}
        {GRIPS.map((t) => {
          const [x1, y1] = polar(cx, cy, 15.5, t)
          const [x2, y2] = polar(cx, cy, 18, t)
          return (
            <line
              key={`grip-${t}`}
              x1={x1.toFixed(2)}
              y1={y1.toFixed(2)}
              x2={x2.toFixed(2)}
              y2={y2.toFixed(2)}
              stroke="var(--knob-grip)"
              strokeWidth="1.2"
            />
          )
        })}
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
  /** Accessible name, also used in the drag tooltip. */
  label: PropTypes.string,
  /** Human-readable value announced by assistive tech. */
  valueText: PropTypes.string,
  dragDirection: PropTypes.number,
}
