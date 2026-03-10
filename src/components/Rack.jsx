import CassetteCard from './CassetteCard'
import PropTypes from 'prop-types'
import './Rack.css'

export default function Rack({
  tracks,
  loadedId,
  playing,
  onLoad,
  radioEnabled,
  favorites,
  onFavorite,
  onQueue,
  onlyFavorites,
  onToggleFavorites,
}) {
  const filtered = onlyFavorites ? tracks.filter((t) => favorites.includes(t.id)) : tracks

  return (
    <section className={radioEnabled ? 'rack rack--radio' : 'rack'}>
      <header className="rack-hd">
        <span className="rack-title">TAPE RACK</span>
        <div className="rack-tools">
          <button
            className={onlyFavorites ? 'mini-btn mini-btn--on' : 'mini-btn'}
            onClick={onToggleFavorites}
          >
            Favorites
          </button>
          <span className="rack-count">{filtered.length} tapes</span>
        </div>
      </header>
      <div className="rack-grid">
        {filtered.map((t) => (
          <CassetteCard
            key={t.id}
            track={t}
            loaded={t.id === loadedId}
            playing={t.id === loadedId && playing}
            favorite={favorites.includes(t.id)}
            onFavorite={() => onFavorite(t.id)}
            onQueue={() => onQueue(t.id)}
            onClick={() => onLoad(t)}
          />
        ))}
      </div>
    </section>
  )
}

const trackShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  color: PropTypes.string,
  accent: PropTypes.string,
  emoji: PropTypes.string,
  bpm: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  key: PropTypes.string,
})

Rack.propTypes = {
  tracks: PropTypes.arrayOf(trackShape).isRequired,
  loadedId: PropTypes.string,
  playing: PropTypes.bool.isRequired,
  onLoad: PropTypes.func.isRequired,
  radioEnabled: PropTypes.bool.isRequired,
  favorites: PropTypes.arrayOf(PropTypes.string).isRequired,
  onFavorite: PropTypes.func.isRequired,
  onQueue: PropTypes.func.isRequired,
  onlyFavorites: PropTypes.bool.isRequired,
  onToggleFavorites: PropTypes.func.isRequired,
}
