import PropTypes from 'prop-types'
import './Reel.css'

export default function Reel({ spin, size = 36 }) {
  return (
    <svg
      className={spin ? 'reel reel--spin' : 'reel'}
      width={size}
      height={size}
      viewBox="0 0 36 36"
      aria-hidden="true"
    >
      <circle cx="18" cy="18" r="16" fill="#0e0e12" stroke="#2a2a38" strokeWidth="1.5" />
      {[0, 60, 120, 180, 240, 300].map((d) => {
        const r = (d * Math.PI) / 180
        return (
          <line
            key={d}
            x1={18 + 5 * Math.cos(r)}
            y1={18 + 5 * Math.sin(r)}
            x2={18 + 13 * Math.cos(r)}
            y2={18 + 13 * Math.sin(r)}
            stroke="#2e2e3c"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )
      })}
      <circle cx="18" cy="18" r="4" fill="#1a1a22" stroke="#333344" strokeWidth="1" />
      <circle cx="18" cy="18" r="1.5" fill="#0a0a10" />
    </svg>
  )
}

Reel.propTypes = {
  spin: PropTypes.bool.isRequired,
  size: PropTypes.number,
}
