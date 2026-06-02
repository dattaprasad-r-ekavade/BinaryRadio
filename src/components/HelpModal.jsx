import { useEffect } from 'react'
import PropTypes from 'prop-types'
import './HelpModal.css'

export default function HelpModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="shortcuts-backdrop" onClick={onClose}>
      <section
        className="shortcuts"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shortcuts-hd">
          <strong>Keyboard shortcuts</strong>
          <button className="mini-btn" onClick={onClose} type="button">
            Close
          </button>
        </header>
        <ul className="shortcuts-list">
          <li>
            <kbd>Space</kbd> play / pause
          </li>
          <li>
            <kbd>S</kbd> stop
          </li>
          <li>
            <kbd>N</kbd> / <kbd>P</kbd> next / previous track
          </li>
          <li>
            <kbd>+</kbd> / <kbd>-</kbd> tempo
          </li>
          <li>
            <kbd>L</kbd> loop
          </li>
          <li>
            <kbd>T</kbd> toggle theme
          </li>
          <li>
            <kbd>H</kbd> toggle this help panel
          </li>
        </ul>
      </section>
    </div>
  )
}

HelpModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}
