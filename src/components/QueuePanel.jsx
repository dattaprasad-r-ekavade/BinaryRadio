import PropTypes from 'prop-types'
import './QueuePanel.css'

/* The move/remove controls previously rendered the literal characters "?" and
   "X" — placeholder glyphs that shipped. These are proper icons. */

function ArrowIcon({ up = false }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d={up ? 'M8 3.5l5 6H3z' : 'M8 12.5l-5-6h10z'}
        fill="currentColor"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

ArrowIcon.propTypes = { up: PropTypes.bool }

export default function QueuePanel({ queueTracks, onRemove, onMove, onClear, onPlayNow }) {
  const count = queueTracks.length

  return (
    <section className="queue-panel" aria-label="Playlist queue">
      <header className="queue-hd">
        <span className="queue-title">
          PLAYLIST QUEUE
          {count > 0 && <span className="queue-count">{count}</span>}
        </span>
        <button type="button" className="mini-btn" onClick={onClear} disabled={!count}>
          Clear
        </button>
      </header>

      {!count && (
        <p className="queue-empty">
          Nothing queued. Use the queue button on a cassette to line up tapes.
        </p>
      )}

      {count > 0 && (
        <ol className="queue-list">
          {queueTracks.map((track, idx) => (
            <li key={`${track.id}-${idx}`} className="queue-row">
              <span className="queue-idx" aria-hidden="true">
                {idx + 1}
              </span>
              <span className="queue-title-text">{track.title}</span>
              <div className="queue-actions">
                <button
                  type="button"
                  className="queue-icon-btn"
                  aria-label={`Move ${track.title} up`}
                  onClick={() => onMove(idx, idx - 1)}
                  disabled={idx === 0}
                >
                  <ArrowIcon up />
                </button>
                <button
                  type="button"
                  className="queue-icon-btn"
                  aria-label={`Move ${track.title} down`}
                  onClick={() => onMove(idx, idx + 1)}
                  disabled={idx === count - 1}
                >
                  <ArrowIcon />
                </button>
                <button type="button" className="mini-btn" onClick={() => onPlayNow(idx)}>
                  Play
                </button>
                <button
                  type="button"
                  className="queue-icon-btn queue-icon-btn--danger"
                  aria-label={`Remove ${track.title} from queue`}
                  onClick={() => onRemove(idx)}
                >
                  <CloseIcon />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

QueuePanel.propTypes = {
  queueTracks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onRemove: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onPlayNow: PropTypes.func.isRequired,
}
