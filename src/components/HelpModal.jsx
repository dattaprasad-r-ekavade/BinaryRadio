import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import './HelpModal.css'

export default function HelpModal({ open, onClose }) {
  const closeRef = useRef(/** @type {HTMLButtonElement | null} */ (null))
  const restoreRef = useRef(/** @type {Element | null} */ (null))

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    /* Move focus into the dialog and hand it back on close. Without this the
       dialog opened with focus still on the page behind it, so keyboard users
       had to tab through the whole app to reach it. */
    restoreRef.current = document.activeElement
    closeRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', onKey)
      const previous = restoreRef.current
      if (previous instanceof HTMLElement) previous.focus()
    }
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
          <button className="mini-btn" onClick={onClose} type="button" ref={closeRef}>
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
        <h3 className="shortcuts-subhd">RJ Radio</h3>
        <ol className="shortcuts-export-steps">
          <li>Enable <strong>RJ Radio</strong> on the deck to auto-advance tracks.</li>
          <li>
            Use <strong>Skip → RJ</strong> during a song to jump straight to the DJ announcement (handy
            for demos).
          </li>
        </ol>
        <h3 className="shortcuts-subhd">WAV export</h3>
        <ol className="shortcuts-export-steps">
          <li>Load a cassette and wait for ENGINE READY.</li>
          <li>
            Press <kbd>PLAY</kbd> so audio is actually running (required for capture).
          </li>
          <li>
            Tap <strong>Start Rec</strong> on the deck — recording begins immediately.
          </li>
          <li>Let the tune play for as long as you want in the file.</li>
          <li>
            Tap <strong>Save WAV</strong> — your browser downloads a <code>.wav</code> file.
          </li>
        </ol>
      </section>
    </div>
  )
}

HelpModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}
