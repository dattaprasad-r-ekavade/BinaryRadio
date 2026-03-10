import PropTypes from 'prop-types'
import './HelpModal.css'

export default function HelpModal({ open, onClose }) {
  if (!open) return null

  return (
    <section className="shortcuts" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <button className="mini-btn" onClick={onClose} title="Close shortcuts">
        Close
      </button>
      <strong>Keyboard:</strong> Space play/pause, S stop, N/P next/prev, +/- tempo, L loop, T
      theme, H toggle help.
    </section>
  )
}

HelpModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}
