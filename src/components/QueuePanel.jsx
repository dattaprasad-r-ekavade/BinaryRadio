import PropTypes from 'prop-types'
import './QueuePanel.css'

export default function QueuePanel({ queueTracks, onRemove, onMove, onClear, onPlayNow }) {
  return (
    <section className="queue-panel">
      <header className="queue-hd">
        <span>PLAYLIST QUEUE</span>
        <button className="queue-clear" onClick={onClear} disabled={!queueTracks.length}>
          Clear
        </button>
      </header>
      {!queueTracks.length && <div className="queue-empty">No queued tracks</div>}
      {queueTracks.map((track, idx) => (
        <div key={`${track.id}-${idx}`} className="queue-row">
          <span className="queue-title">
            {idx + 1}. {track.title}
          </span>
          <div className="queue-actions">
            <button aria-label="Move track up" onClick={() => onMove(idx, idx - 1)} disabled={idx === 0}>
              ?
            </button>
            <button
              aria-label="Move track down"
              onClick={() => onMove(idx, idx + 1)}
              disabled={idx === queueTracks.length - 1}
            >
              ?
            </button>
            <button onClick={() => onPlayNow(idx)}>Play</button>
            <button aria-label="Remove track from queue" onClick={() => onRemove(idx)}>
              X
            </button>
          </div>
        </div>
      ))}
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
