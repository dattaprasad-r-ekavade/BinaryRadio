import PropTypes from 'prop-types'
import './VUMeter.css'

export default function VUMeter({ active, ch }) {
  return (
    <div className="vu">
      <span className="vu-ch">{ch}</span>
      <div className="vu-bars">
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i} className={active ? 'vu-b vu-b--on' : 'vu-b'} style={{ '--i': i }} />
        ))}
      </div>
    </div>
  )
}

VUMeter.propTypes = {
  active: PropTypes.bool.isRequired,
  ch: PropTypes.string.isRequired,
}
