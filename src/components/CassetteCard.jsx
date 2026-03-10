import Reel from './Reel'
import PropTypes from 'prop-types'
import './CassetteCard.css'

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

  return (
    <div
      className={loaded ? 'cas cas--loaded' : 'cas'}
      style={{ '--cc': track.color, '--ca': track.accent }}
      onClick={onClick}
      onKeyDown={onCardKeyDown}
      role="button"
      tabIndex={0}
      title={`${track.title} - ${track.description}`}
      aria-label={`${track.title} tape`}
    >
      <div className="cas-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className={favorite ? 'cas-star cas-star--on' : 'cas-star'}
          title="Toggle favorite"
          aria-label={favorite ? 'Remove favorite' : 'Add favorite'}
          onClick={onFavorite}
        >
          *
        </button>
        <button className="cas-q" title="Add to queue" aria-label="Add to queue" onClick={onQueue}>
          +Q
        </button>
      </div>
      <div className="cas-label">
        <div className="cas-top">
          <span className="cas-emoji">{track.emoji}</span>
          {loaded && <span className="cas-badge">{playing ? 'PLAY' : 'STOP'}</span>}
        </div>
        <div className="cas-name">{track.title}</div>
        <div className="cas-desc">{track.description}</div>
        <div className="cas-meta">
          {track.bpm} bpm - {track.key}
        </div>
      </div>
      <div className="cas-mech">
        <div className="cas-screw" />
        <div className="cas-win">
          <Reel spin={loaded && playing} size={22} />
          <div className="cas-bridge" />
          <Reel spin={loaded && playing} size={22} />
        </div>
        <div className="cas-screw" />
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
