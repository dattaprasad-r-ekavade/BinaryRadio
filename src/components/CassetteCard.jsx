import Reel from './Reel'
import PropTypes from 'prop-types'
import './CassetteCard.css'

function StarIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable="false">
      <path
        d="M8 1.6l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.4l-3.8 2 .7-4.3-3.1-3 4.3-.6z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function QueueIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M2 4h8M2 8h8M2 12h5" />
        <path d="M12.5 9.5v5M10 12h5" />
      </g>
    </svg>
  )
}

export default function CassetteCard({
  track,
  loaded,
  playing,
  onClick,
  favorite,
  onFavorite,
  onQueue,
}) {
  const onCardKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  const status = loaded ? (playing ? 'Playing' : 'Loaded') : null

  return (
    <div
      className={loaded ? 'cas cas--loaded' : 'cas'}
      style={{ '--cc': track.color, '--ca': track.accent }}
      onClick={onClick}
      onKeyDown={onCardKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${track.title}${status ? `, ${status}` : ''}. ${track.description}`}
    >
      <div className="cas-label">
        <div className="cas-label-head">
          <span className="cas-emoji" aria-hidden="true">
            {track.emoji}
          </span>
          <span className="cas-name">{track.title}</span>
          {loaded && (
            <span className={playing ? 'cas-badge cas-badge--playing' : 'cas-badge'}>
              {playing ? 'PLAYING' : 'LOADED'}
            </span>
          )}
        </div>
        <p className="cas-desc">{track.description}</p>
        <div className="cas-meta">
          <span>{track.bpm} BPM</span>
          <span className="cas-meta-sep" aria-hidden="true">
            ·
          </span>
          <span>{track.key}</span>
        </div>
      </div>

      <div className="cas-mech" aria-hidden="true">
        <span className="cas-screw" />
        <span className="cas-win">
          <Reel spin={loaded && playing} size={20} />
          <span className="cas-bridge" />
          <Reel spin={loaded && playing} size={20} />
        </span>
        <span className="cas-screw" />
      </div>

      {/* Rendered last so it paints above the label without a z-index war. */}
      <div className="cas-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={favorite ? 'cas-act cas-act--fav' : 'cas-act'}
          title={favorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={favorite ? `Remove ${track.title} from favorites` : `Add ${track.title} to favorites`}
          aria-pressed={favorite}
          onClick={onFavorite}
        >
          <StarIcon />
        </button>
        <button
          type="button"
          className="cas-act"
          title="Add to queue"
          aria-label={`Add ${track.title} to queue`}
          onClick={onQueue}
        >
          <QueueIcon />
        </button>
      </div>
    </div>
  )
}

CassetteCard.propTypes = {
  track: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    color: PropTypes.string,
    accent: PropTypes.string,
    emoji: PropTypes.string,
    bpm: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    key: PropTypes.string.isRequired,
  }).isRequired,
  loaded: PropTypes.bool.isRequired,
  playing: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  favorite: PropTypes.bool.isRequired,
  onFavorite: PropTypes.func.isRequired,
  onQueue: PropTypes.func.isRequired,
}
