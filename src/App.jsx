import { useState, useEffect, useCallback } from 'react'
import { tracks as staticTracks } from './data/tracks'
import { useStrudel } from './hooks/useStrudel'
import './App.css'

// ─────────────────────────────────── helpers
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

// ─────────────────────────────────── Reel SVG
function Reel({ spin, size = 36 }) {
  return (
    <svg
      className={spin ? 'reel reel--spin' : 'reel'}
      width={size} height={size} viewBox="0 0 36 36"
      aria-hidden="true"
    >
      <circle cx="18" cy="18" r="16" fill="#0e0e12" stroke="#2a2a38" strokeWidth="1.5" />
      {[0,60,120,180,240,300].map(d => {
        const r = (d * Math.PI) / 180
        return (
          <line
            key={d}
            x1={18 + 5 * Math.cos(r)} y1={18 + 5 * Math.sin(r)}
            x2={18 + 13 * Math.cos(r)} y2={18 + 13 * Math.sin(r)}
            stroke="#2e2e3c" strokeWidth="1.5" strokeLinecap="round"
          />
        )
      })}
      <circle cx="18" cy="18" r="4" fill="#1a1a22" stroke="#333344" strokeWidth="1" />
      <circle cx="18" cy="18" r="1.5" fill="#0a0a10" />
    </svg>
  )
}

// ─────────────────────────────────── VU Meter
function VUMeter({ active, ch }) {
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

// ─────────────────────────────────── Transport button (all identical size)
function TBtn({ icon, label, onClick, active, disabled, glow, variant }) {
  let cls = 'tbtn'
  if (variant) cls += ` tbtn--${variant}`
  if (active)  cls += ' tbtn--active'
  if (glow)    cls += ' tbtn--glow'
  return (
    <button className={cls} onClick={onClick} disabled={!!disabled} title={label}>
      <span className="tbtn-ico">{icon}</span>
      <span className="tbtn-lbl">{label}</span>
    </button>
  )
}

// ─────────────────────────────────── Cassette card
function CassetteCard({ track, loaded, playing, onClick }) {
  return (
    <button
      className={loaded ? 'cas cas--loaded' : 'cas'}
      style={{ '--cc': track.color, '--ca': track.accent }}
      onClick={onClick}
      title={`${track.title} — ${track.description}`}
    >
      {/* label strip */}
      <div className="cas-label">
        <div className="cas-top">
          <span className="cas-emoji">{track.emoji}</span>
          {loaded && (
            <span className="cas-badge">{playing ? '▶' : '■'}</span>
          )}
        </div>
        <div className="cas-name">{track.title}</div>
        <div className="cas-desc">{track.description}</div>
      </div>
      {/* mechanism strip */}
      <div className="cas-mech">
        <div className="cas-screw" />
        <div className="cas-win">
          <Reel spin={loaded && playing} size={22} />
          <div className="cas-bridge" />
          <Reel spin={loaded && playing} size={22} />
        </div>
        <div className="cas-screw" />
      </div>
    </button>
  )
}

// ─────────────────────────────────── Deck
function Deck({ track, playing, paused, looping, cps, ready, onPlay, onPause, onStop, onLoop, onCps }) {
  const bpm = Math.round(cps * 60 * 4)
  const loaded = !!track
  const state = playing ? 'playing' : paused ? 'paused' : 'stopped'

  return (
    <div className="deck">

      {/* Brand strip */}
      <div className="deck-brand">
        <span className="deck-brand-name">DIALTONE</span>
        <span className="deck-brand-model">DT-01  ◆  CASSETTE DECK</span>
      </div>

      {/* Tape window */}
      <div className="deck-win">
        <Reel spin={playing} size={52} />
        <div className="deck-info">
          {track ? (
            <>
              <div className="deck-playing-label">NOW PLAYING</div>
              <div className="deck-emoji">{track.emoji}</div>
              <div className="deck-track">{track.title}</div>
              <div className="deck-desc">{track.description}</div>
            </>
          ) : (
            <>
              <div className="deck-eject-ico">⏏</div>
              <div className="deck-idle">NO TAPE</div>
              <div className="deck-idle-sub">pick a cassette below</div>
            </>
          )}
          <div className={`deck-state deck-state--${state}`}>
            {state === 'playing' ? '● REC' : state === 'paused' ? '⏸ PAUSED' : '■ STOPPED'}
          </div>
        </div>
        <Reel spin={playing} size={52} />
      </div>

      {/* VU meters */}
      <div className="deck-vu">
        <VUMeter active={playing} ch="L" />
        <VUMeter active={playing} ch="R" />
      </div>

      {/* Transport — all buttons same size */}
      <div className="deck-transport">
        <TBtn
          icon="■" label="STOP"
          onClick={onStop}
          active={!loaded ? false : state === 'stopped'}
          disabled={!loaded}
        />
        <TBtn
          icon="◀◀" label="REW"
          onClick={onStop}
          disabled={!loaded}
        />
        <TBtn
          icon={playing ? '⏸' : '▶'}
          label={playing ? 'PAUSE' : 'PLAY'}
          onClick={playing ? onPause : onPlay}
          active={playing}
          glow={loaded && !playing && ready}
          disabled={!loaded || !ready}
          variant="play"
        />
        <TBtn
          icon="⟳" label="LOOP"
          onClick={onLoop}
          active={looping}
          variant="loop"
        />
      </div>

      {/* Tempo */}
      <div className="deck-tempo">
        <span className="tempo-lbl">TEMPO</span>
        <input
          className="tempo-slider" type="range"
          min="0.05" max="1.0" step="0.01" value={cps}
          onChange={e => onCps(parseFloat(e.target.value))}
        />
        <div className="tempo-val">
          <span className="tempo-cps">{cps.toFixed(2)}</span>
          <span className="tempo-unit">cps</span>
          <span className="tempo-bpm">{bpm}<small>bpm</small></span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────── Rack
function Rack({ tracks, loadedId, playing, onLoad }) {
  return (
    <section className="rack">
      <header className="rack-hd">
        <span className="rack-title">TAPE RACK</span>
        <span className="rack-count">{tracks.length} tapes</span>
      </header>
      <div className="rack-grid">
        {tracks.map(t => (
          <CassetteCard
            key={t.id}
            track={t}
            loaded={t.id === loadedId}
            playing={t.id === loadedId && playing}
            onClick={() => onLoad(t)}
          />
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────── App
export default function App() {
  const { ready, initializing, error, play, stop, setCps } = useStrudel()

  // Dynamic track list — reads manifest.json from the server, falls back to static
  const [tracks, setTracks] = useState(staticTracks)
  useEffect(() => {
    fetch('/tunes/manifest.json')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data) && data.length) setTracks(data) })
      .catch(() => {})
  }, [])

  const [loadedTrack,  setLoadedTrack]  = useState(null)
  const [deckState,    setDeckState]    = useState('stopped')   // stopped | playing | paused
  const [looping,      setLooping]      = useState(true)
  const [cps,          setCpsState]     = useState(0.25)
  const [loadedCode,   setLoadedCode]   = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [msg,          setMsg]          = useState(null)

  // ── handlers ──────────────────────────────────────────────
  const handleStop = useCallback(() => {
    stop()
    setDeckState('stopped')
  }, [stop])

  const handlePlay = useCallback(async () => {
    if (!loadedCode || !ready) return
    setMsg(null)
    try {
      await play(loadedCode)
      setDeckState('playing')
    } catch (e) {
      setMsg({ type: 'err', text: e.message })
    }
  }, [loadedCode, ready, play])

  const handlePause = useCallback(() => {
    stop()
    setDeckState('paused')
  }, [stop])

  const handleCps = useCallback((v) => {
    const c = clamp(v, 0.05, 1.0)
    setCpsState(c)
    setCps(c)
  }, [setCps])

  const handleLoad = useCallback(async (track) => {
    handleStop()
    setLoadedTrack(track)
    setLoadedCode(null)
    setLoading(true)
    setMsg({ type: 'wait', text: `Loading ${track.title}…` })
    try {
      const res = await fetch(track.file)
      if (!res.ok) throw new Error(`Cannot load ${track.file} (${res.status})`)
      let code = await res.text()
      code = code.replace(/^setcps\([^)]*\)\n?/m, '')   // tempo controlled by slider
      setLoadedCode(code)
      setMsg(null)
    } catch (e) {
      setMsg({ type: 'err', text: e.message })
    } finally {
      setLoading(false)
    }
  }, [handleStop])

  // keep engine CPS in sync while playing
  useEffect(() => {
    if (deckState === 'playing') setCps(cps)
  }, [cps, deckState, setCps])

  const engineState = initializing ? 'wait' : error ? 'err' : ready ? 'ok' : 'wait'
  const engineLabel = initializing ? 'LOADING…' : error ? 'ENGINE ERROR' : ready ? 'ENGINE READY' : 'OFFLINE'

  return (
    <div className="app">

      <header className="app-hd">
        <div className="logo">
          <span className="logo-icon">📼</span>
          <span className="logo-name">DIALTONE</span>
        </div>
        <div className={`eng eng--${engineState}`}>
          <span className="eng-led" />
          <span className="eng-txt">{engineLabel}</span>
        </div>
      </header>

      <Deck
        track={loadedTrack}
        playing={deckState === 'playing'}
        paused={deckState === 'paused'}
        looping={looping}
        cps={cps}
        ready={ready}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onLoop={() => setLooping(l => !l)}
        onCps={handleCps}
      />

      {msg && (
        <div className={`app-msg app-msg--${msg.type}`}>{msg.text}</div>
      )}

      {loadedCode && deckState !== 'playing' && !loading && (
        <button className="play-hint" onClick={handlePlay} disabled={!ready}>
          ▶ PLAY — {loadedTrack?.title}
        </button>
      )}

      <Rack
        tracks={tracks}
        loadedId={loadedTrack?.id}
        playing={deckState === 'playing'}
        onLoad={handleLoad}
      />

      <footer className="app-ft">
        <span>Powered by <a href="https://strudel.cc" target="_blank" rel="noreferrer">Strudel</a></span>
        <span className="ft-dot">·</span>
        <span>Pick a tape — press PLAY</span>
        <span className="ft-dot">·</span>
        <a href="https://buymeachai.ezee.li/datathecodie" target="_blank" rel="noreferrer" className="bmc">☕ Buy me a chai</a>
      </footer>

    </div>
  )
}
