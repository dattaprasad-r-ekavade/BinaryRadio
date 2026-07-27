import PropTypes from 'prop-types'
import './Reel.css'

const SPOKES = [0, 60, 120, 180, 240, 300]

/**
 * Tape reel. Colours come from CSS custom properties rather than literals so
 * the reel stays visible in both themes (it was previously hard-coded to
 * near-black and disappeared in light mode).
 */
export default function Reel({ spin, size = 36 }) {
  return (
    <svg
      className={spin ? 'reel reel--spin' : 'reel'}
      width={size}
      height={size}
      viewBox="0 0 36 36"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="18"
        cy="18"
        r="16"
        fill="var(--reel-body)"
        stroke="var(--reel-stroke)"
        strokeWidth="1.5"
      />
      {SPOKES.map((d) => {
        const r = (d * Math.PI) / 180
        return (
          <line
            key={d}
            x1={18 + 5 * Math.cos(r)}
            y1={18 + 5 * Math.sin(r)}
            x2={18 + 13 * Math.cos(r)}
            y2={18 + 13 * Math.sin(r)}
            stroke="var(--reel-spoke)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )
      })}
      <circle
        cx="18"
        cy="18"
        r="4"
        fill="var(--reel-hub)"
        stroke="var(--reel-hub-stroke)"
        strokeWidth="1"
      />
      <circle cx="18" cy="18" r="1.5" fill="var(--reel-stroke)" />
    </svg>
  )
}

Reel.propTypes = {
  spin: PropTypes.bool.isRequired,
  size: PropTypes.number,
}
