import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { tracks as staticTracks } from './data/tracks'
import { useStrudel } from './hooks/useStrudel'
import { useRadioMode } from './hooks/useRadioMode'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { enqueue, dequeue, removeFromQueue, moveQueueItem, toggleFavorite } from './utils/playlist'
import './App.css'

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

function formatDuration(seconds = 0) {
  const s = Math.max(0, Number(seconds) || 0)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

function normalizeTrack(track, index = 0) {
  return {
    ...track,
    title: track.title || `Untitled ${index + 1}`,
    description: track.description || 'Custom tune',
    color: track.color || '#1b3a60',
    accent: track.accent || '#4a88dd',
    emoji: track.emoji || '🎵',
    bpm: Number(track.bpm) || 96,
    key: track.key || 'Am',
    moodTags: Array.isArray(track.moodTags) ? track.moodTags : ['ambient'],
    durationSec: Number(track.durationSec) || 180,
  }
}

function extractSampleSelectors(code) {
  const out = new Set()
  const re = /\bs\((['"])([\s\S]*?)\1\)/g
  let m
  while ((m = re.exec(code))) {
    const pat = m[2]
    const tokRe = /\b([a-zA-Z][a-zA-Z0-9_-]*)(?::(\d+))?\b/g
    let t
    while ((t = tokRe.exec(pat))) {
      const name = t[1]
      const idx = t[2] ?? '0'
      out.add(`${name}:${idx}`)
    }
  }
  return [...out]
}

function arcSegment(cx, cy, r, startDeg, endDeg) {
  const toRad = (d) => (d * Math.PI) / 180
  const sx = cx + r * Math.sin(toRad(startDeg))
  const sy = cy - r * Math.cos(toRad(startDeg))
  const ex = cx + r * Math.sin(toRad(endDeg))
  const ey = cy - r * Math.cos(toRad(endDeg))
  const span = endDeg - startDeg
  if (Math.abs(span) < 0.5) return null
  const large = Math.abs(span) > 180 ? 1 : 0
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`
}

function Knob({ value, min = 0, max = 1, onChange, trackColor = '#00e87a', glowColor = 'rgba(0,232,122,.6)', dragTitle, dragDirection = 1 }) {
  const startY = useRef(null)
  const startVal = useRef(null)
  const pct = (value - min) / (max - min)
  const deg = -135 + pct * 270
  const cx = 40
  const cy = 40
  const r = 28

  const bgArc = arcSegment(cx, cy, r, -135, 135)
  const fgArc = arcSegment(cx, cy, r, -135, deg)
  const indX = cx + 14 * Math.sin((deg * Math.PI) / 180)
  const indY = cy - 14 * Math.cos((deg * Math.PI) / 180)

  const startDrag = (clientY) => {
    startY.current = clientY
    startVal.current = value
  }
  const moveDrag = (clientY) => {
    const delta = (startY.current - clientY) / 260
    const next = clamp(startVal.current + (delta * dragDirection) * (max - min), min, max)
    onChange(parseFloat(next.toFixed(2)))
  }

  const onMouseDown = (e) => {
    startDrag(e.clientY)
    const onMove = (mv) => moveDrag(mv.clientY)
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    e.preventDefault()
  }

  const onTouchStart = (e) => {
    startDrag(e.touches[0].clientY)
    const onMove = (mv) => {
      mv.preventDefault()
      moveDrag(mv.touches[0].clientY)
    }
    const onEnd = () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    e.preventDefault()
  }

  return (
    <div className="knob-wrap" onMouseDown={onMouseDown} onTouchStart={onTouchStart} title={dragTitle ?? 'Drag up/down'}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        {bgArc && <path d={bgArc} fill="none" stroke="#1a1a28" strokeWidth="4.5" strokeLinecap="round" />}
        {fgArc && <path d={fgArc} fill="none" stroke={trackColor} strokeWidth="4.5" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }} />}
        <circle cx={cx} cy={cy} r="20" fill="#0e0e18" stroke="#2a2a3c" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="18" fill="#111120" stroke="#1e1e2e" strokeWidth="1" />
        <circle cx={indX.toFixed(2)} cy={indY.toFixed(2)} r="3.5" fill={trackColor} style={{ filter: `drop-shadow(0 0 5px ${trackColor})` }} />
      </svg>
    </div>
  )
}

function Reel({ spin, size = 36 }) {
  return (
    <svg className={spin ? 'reel reel--spin' : 'reel'} width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="16" fill="#0e0e12" stroke="#2a2a38" strokeWidth="1.5" />
      {[0, 60, 120, 180, 240, 300].map((d) => {
        const r = (d * Math.PI) / 180
        return (
          <line
            key={d}
            x1={18 + 5 * Math.cos(r)}
            y1={18 + 5 * Math.sin(r)}
            x2={18 + 13 * Math.cos(r)}
            y2={18 + 13 * Math.sin(r)}
            stroke="#2e2e3c"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )
      })}
      <circle cx="18" cy="18" r="4" fill="#1a1a22" stroke="#333344" strokeWidth="1" />
      <circle cx="18" cy="18" r="1.5" fill="#0a0a10" />
    </svg>
  )
}

function Visualizer({ analyser, mode, playing }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf = null
    const w = () => canvas.clientWidth
    const h = () => canvas.clientHeight

    const freqData = analyser ? new Uint8Array(analyser.frequencyBinCount) : null
    const timeData = analyser ? new Uint8Array(analyser.fftSize) : null

    const drawFake = (t, fakeMode) => {
      const width = w()
      const height = h()
      ctx.clearRect(0, 0, width, height)
      if (fakeMode === 'waveform') {
        ctx.lineWidth = 2
        ctx.strokeStyle = '#00e87a'
        ctx.beginPath()
        const points = 120
        for (let i = 0; i < points; i += 1) {
          const x = (i / (points - 1)) * width
          const amp = Math.sin((t / 220) + i * 0.18) * 0.36 + Math.sin((t / 140) + i * 0.04) * 0.12
          const y = height * 0.5 + amp * (height * 0.45)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      } else {
        ctx.fillStyle = 'rgba(0,232,122,.22)'
        const bars = 30
        for (let i = 0; i < bars; i += 1) {
          const phase = (t / 180) + i * 0.28
          const amp = (Math.sin(phase) + 1) * 0.5
          const bw = width / bars - 2
          const bh = amp * height * 0.9
          ctx.fillRect(i * (bw + 2), height - bh, bw, bh)
        }
      }
    }

    const draw = (t = 0) => {
      const width = w()
      const height = h()
      canvas.width = width
      canvas.height = height
      ctx.clearRect(0, 0, width, height)

      if (!playing) {
        ctx.fillStyle = 'rgba(90,88,122,.22)'
        ctx.fillRect(0, height - 6, width, 6)
        raf = requestAnimationFrame(draw)
        return
      }

      if (!analyser || (!freqData && !timeData)) {
        drawFake(t, mode)
        raf = requestAnimationFrame(draw)
        return
      }

      if (mode === 'spectrum') {
        analyser.getByteFrequencyData(freqData)
        const bars = 56
        const step = Math.max(1, Math.floor(freqData.length / bars))
        const bw = width / bars
        for (let i = 0; i < bars; i += 1) {
          const v = freqData[i * step] / 255
          const bh = Math.max(2, v * height)
          ctx.fillStyle = i > 42 ? '#ff7a4b' : i > 28 ? '#ffb703' : '#00e87a'
          ctx.fillRect(i * bw + 1, height - bh, Math.max(1, bw - 2), bh)
        }
      } else {
        analyser.getByteTimeDomainData(timeData)
        ctx.lineWidth = 2
        ctx.strokeStyle = '#00e87a'
        ctx.beginPath()
        for (let i = 0; i < timeData.length; i += 1) {
          const x = (i / (timeData.length - 1)) * width
          const y = (timeData[i] / 255) * height
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [analyser, mode, playing])

  return <canvas ref={canvasRef} className="viz-canvas" aria-label="Audio visualizer" />
}

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

function TBtn({ icon, label, onClick, active, disabled, glow, variant, hidden }) {
  let cls = 'tbtn'
  if (variant) cls += ` tbtn--${variant}`
  if (active) cls += ' tbtn--active'
  if (glow) cls += ' tbtn--glow'
  if (hidden) cls += ' tbtn--hidden'
  return (
    <button className={cls} onClick={onClick} disabled={!!disabled} title={label}>
      <span className="tbtn-ico">{icon}</span>
      <span className="tbtn-lbl">{label}</span>
    </button>
  )
}

function MetadataPills({ track }) {
  if (!track) return null
  return (
    <div className="meta-pills">
      <span>{track.bpm} BPM</span>
      <span>{track.key}</span>
      <span>{formatDuration(track.durationSec)}</span>
      <span>{track.moodTags?.join(' · ')}</span>
    </div>
  )
}

function CassetteCard({ track, loaded, playing, onClick, favorite, onFavorite, onQueue }) {
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
      title={`${track.title} — ${track.description}`}
      aria-label={`${track.title} tape`}
    >
      <div className="cas-actions" onClick={(e) => e.stopPropagation()}>
        <button className={favorite ? 'cas-star cas-star--on' : 'cas-star'} title="Toggle favorite" onClick={onFavorite}>
          ★
        </button>
        <button className="cas-q" title="Add to queue" onClick={onQueue}>
          +Q
        </button>
      </div>
      <div className="cas-label">
        <div className="cas-top">
          <span className="cas-emoji">{track.emoji}</span>
          {loaded && <span className="cas-badge">{playing ? '▶' : '■'}</span>}
        </div>
        <div className="cas-name">{track.title}</div>
        <div className="cas-desc">{track.description}</div>
        <div className="cas-meta">{track.bpm} bpm • {track.key}</div>
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

function QueuePanel({ queueTracks, onRemove, onMove, onClear, onPlayNow }) {
  return (
    <section className="queue-panel">
      <header className="queue-hd">
        <span>PLAYLIST QUEUE</span>
        <button className="queue-clear" onClick={onClear} disabled={!queueTracks.length}>Clear</button>
      </header>
      {!queueTracks.length && <div className="queue-empty">No queued tracks</div>}
      {queueTracks.map((track, idx) => (
        <div key={`${track.id}-${idx}`} className="queue-row">
          <span className="queue-title">{idx + 1}. {track.title}</span>
          <div className="queue-actions">
            <button onClick={() => onMove(idx, idx - 1)} disabled={idx === 0}>↑</button>
            <button onClick={() => onMove(idx, idx + 1)} disabled={idx === queueTracks.length - 1}>↓</button>
            <button onClick={() => onPlayNow(idx)}>Play</button>
            <button onClick={() => onRemove(idx)}>✕</button>
          </div>
        </div>
      ))}
    </section>
  )
}

function Deck({
  track,
  playing,
  paused,
  looping,
  cps,
  ready,
  onPlay,
  onPause,
  onStop,
  onLoop,
  onCps,
  rjVolume,
  onRjVolume,
  radioEnabled,
  radioPhase,
  radioTimeLeft,
  onRadioToggle,
  visualMode,
  onVisualMode,
  analyser,
  masterVolume,
  onMasterVolume,
  eq,
  onEq,
  onExport,
  exporting,
  audioReady,
}) {
  const bpm = Math.round(cps * 60 * 4)
  const loaded = !!track
  const state = playing ? 'playing' : paused ? 'paused' : 'stopped'

  return (
    <div className="deck">
      <div className="deck-brand">
        <span className="deck-brand-name">SYNTHREEL</span>
        <span className="deck-brand-model">SR-01 ◆ CASSETTE DECK</span>
      </div>

      <div className="deck-vizwrap">
        <Visualizer analyser={analyser} mode={visualMode} playing={playing} />
      </div>

      <div className="deck-win">
        <Reel spin={playing} size={52} />
        <div className="deck-info">
          {track ? (
            <>
              <div className="deck-playing-label">NOW PLAYING</div>
              <div className="deck-emoji">{track.emoji}</div>
              <div className="deck-track">{track.title}</div>
              <div className="deck-desc">{track.description}</div>
              <MetadataPills track={track} />
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

      <div className="deck-vu">
        <VUMeter active={playing} ch="L" />
        <VUMeter active={playing} ch="R" />
      </div>

      <div className={radioEnabled ? 'deck-transport deck-transport--radio' : 'deck-transport'}>
        <TBtn icon="■" label="STOP" onClick={onStop} active={!loaded ? false : state === 'stopped'} disabled={!loaded} hidden={radioEnabled} />
        <TBtn icon="◀◀" label="REW" onClick={onStop} disabled={!loaded} hidden={radioEnabled} />
        <TBtn icon={playing ? '⏸' : '▶'} label={playing ? 'PAUSE' : 'PLAY'} onClick={playing ? onPause : onPlay} active={playing} glow={loaded && !playing && ready} disabled={!loaded || !ready} variant="play" hidden={radioEnabled} />
        <TBtn icon="⟳" label="LOOP" onClick={onLoop} active={looping} variant="loop" hidden={radioEnabled} />
        <TBtn icon="📻" label="RADIO" onClick={onRadioToggle} active={radioEnabled} variant="radio" />
      </div>

      {radioEnabled && (
        <div className={`deck-onair deck-onair--${radioPhase}`}>
          <span className="onair-dot" />
          {radioPhase === 'announcing' ? (
            <>
              <span className="onair-label">RJ ON AIR</span>
              <span className="onair-sub">Now announcing next track…</span>
            </>
          ) : (
            <>
              <span className="onair-label">ON AIR</span>
              <span className="onair-time">
                {radioTimeLeft !== null ? `Next in ${String(Math.floor(radioTimeLeft / 60)).padStart(2, '0')}:${String(radioTimeLeft % 60).padStart(2, '0')}` : ''}
              </span>
            </>
          )}
        </div>
      )}

      <div className="deck-aux">
        <div className="aux-row">
          <span className="aux-title">VIS</span>
          <button className={visualMode === 'waveform' ? 'aux-btn aux-btn--on' : 'aux-btn'} onClick={() => onVisualMode('waveform')}>Wave</button>
          <button className={visualMode === 'spectrum' ? 'aux-btn aux-btn--on' : 'aux-btn'} onClick={() => onVisualMode('spectrum')}>Spectrum</button>
          <button className="aux-btn" onClick={onExport} disabled={!audioReady}>{exporting ? 'Stop Export' : 'Export WAV'}</button>
        </div>
      </div>

      <div className="deck-knobs deck-knobs--wide">
        <div className={radioEnabled ? 'deck-tempo deck-tempo--radio' : 'deck-tempo'}>
          <span className="tempo-lbl">TEMPO</span>
          <Knob value={cps} min={0.05} max={1.0} onChange={onCps} dragTitle="Drag up/down to change tempo" />
          <div className="tempo-val">
            <span className="tempo-cps">{cps.toFixed(2)}</span>
            <span className="tempo-unit">cps</span>
            <span className="tempo-bpm">{bpm}<small>bpm</small></span>
          </div>
        </div>

        <div className="deck-vol">
          <span className="vol-lbl">MASTER</span>
          <Knob value={masterVolume} min={0} max={1.5} onChange={onMasterVolume} trackColor="#0ea5e9" glowColor="rgba(14,165,233,.5)" dragTitle="Master volume" />
          <span className="vol-val">{Math.round(masterVolume * 100)}<small>%</small></span>
        </div>

        <div className="deck-vol">
          <span className="vol-lbl">RJ VOL</span>
          <Knob value={rjVolume} min={0} max={1} onChange={onRjVolume} trackColor="#ffa800" glowColor="rgba(255,168,0,.6)" dragTitle="RJ volume" dragDirection={-1} />
          <span className="vol-val">{Math.round(rjVolume * 100)}<small>%</small></span>
        </div>
      </div>

      <div className="eq-strip">
        <label>
          <span>BASS {eq.bass}dB</span>
          <input type="range" min="-12" max="12" value={eq.bass} onChange={(e) => onEq({ ...eq, bass: Number(e.target.value) })} />
        </label>
        <label>
          <span>MID {eq.mid}dB</span>
          <input type="range" min="-12" max="12" value={eq.mid} onChange={(e) => onEq({ ...eq, mid: Number(e.target.value) })} />
        </label>
        <label>
          <span>TREBLE {eq.treble}dB</span>
          <input type="range" min="-12" max="12" value={eq.treble} onChange={(e) => onEq({ ...eq, treble: Number(e.target.value) })} />
        </label>
      </div>
    </div>
  )
}

function Rack({ tracks, loadedId, playing, onLoad, radioEnabled, favorites, onFavorite, onQueue, onlyFavorites, onToggleFavorites }) {
  const filtered = onlyFavorites ? tracks.filter((t) => favorites.includes(t.id)) : tracks

  return (
    <section className={radioEnabled ? 'rack rack--radio' : 'rack'}>
      <header className="rack-hd">
        <span className="rack-title">TAPE RACK</span>
        <div className="rack-tools">
          <button className={onlyFavorites ? 'mini-btn mini-btn--on' : 'mini-btn'} onClick={onToggleFavorites}>Favorites</button>
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

function TuneEditor({ open, draft, onDraft, onClose, onSave, onPlay }) {
  if (!open) return null
  return (
    <section className="editor">
      <header className="editor-hd">
        <span>CUSTOM TUNE EDITOR</span>
        <button className="mini-btn" onClick={onClose}>Close</button>
      </header>
      <div className="editor-meta">
        <input value={draft.title} onChange={(e) => onDraft({ ...draft, title: e.target.value })} placeholder="Title" />
        <input value={draft.description} onChange={(e) => onDraft({ ...draft, description: e.target.value })} placeholder="Description" />
        <input value={draft.key} onChange={(e) => onDraft({ ...draft, key: e.target.value })} placeholder="Key" />
        <input type="number" value={draft.bpm} onChange={(e) => onDraft({ ...draft, bpm: Number(e.target.value) || 96 })} placeholder="BPM" />
        <input type="number" value={draft.durationSec} onChange={(e) => onDraft({ ...draft, durationSec: Number(e.target.value) || 180 })} placeholder="Duration" />
        <input value={draft.moodTags} onChange={(e) => onDraft({ ...draft, moodTags: e.target.value })} placeholder="Tags comma separated" />
      </div>
      <textarea value={draft.code} onChange={(e) => onDraft({ ...draft, code: e.target.value })} spellCheck="false" />
      <div className="editor-actions">
        <button className="mini-btn" onClick={onPlay}>Play Draft</button>
        <button className="mini-btn mini-btn--on" onClick={onSave}>Add To Rack</button>
      </div>
    </section>
  )
}

export default function App() {
  const {
    ready,
    initializing,
    error,
    audioReady,
    play,
    stop,
    setCps,
    setMasterVolume,
    setEq,
    getAnalyser,
    startWavCapture,
    stopWavCapture,
    warmup,
  } = useStrudel()

  const [manifestTracks, setManifestTracks] = useState(staticTracks.map(normalizeTrack))
  const [customTunes, setCustomTunes] = useLocalStorage('synthreel.customTunes.v1', [])
  const [favorites, setFavorites] = useLocalStorage('synthreel.favorites.v1', [])
  const [queue, setQueue] = useLocalStorage('synthreel.queue.v1', [])
  const [theme, setTheme] = useLocalStorage('synthreel.theme.v1', 'system')
  const [masterVolume, setMasterVolumeState] = useLocalStorage('synthreel.masterVolume.v1', 1)
  const [eq, setEqState] = useLocalStorage('synthreel.eq.v1', { bass: 0, mid: 0, treble: 0 })

  const [loadedTrack, setLoadedTrack] = useState(null)
  const [deckState, setDeckState] = useState('stopped')
  const [looping, setLooping] = useState(true)
  const [cps, setCpsState] = useState(0.25)
  const [loadedCode, setLoadedCode] = useState(null)
  const [loadedSamples, setLoadedSamples] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [rjVolume, setRjVolume] = useState(0.6)
  const [visualMode, setVisualMode] = useState('spectrum')
  const [showEditor, setShowEditor] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [exporting, setExporting] = useState(false)

  const [draftTune, setDraftTune] = useState({
    title: 'My Tune',
    description: 'Custom browser tune',
    key: 'Am',
    bpm: 96,
    durationSec: 180,
    moodTags: 'custom,ambient',
    code: 'setcps(0.25)\nstack([\n  note("c3 e3 g3").slow(2).s("triangle"),\n  s("bd sn").slow(2).gain(0.8)\n])',
  })

  useEffect(() => {
    fetch('/tunes/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setManifestTracks(data.map(normalizeTrack))
        }
      })
      .catch(() => {})
  }, [])

  const customTracks = useMemo(
    () => customTunes.map((t, i) => normalizeTrack({ ...t, custom: true }, i)),
    [customTunes],
  )

  const tracks = useMemo(() => {
    const map = new Map()
    for (const t of [...manifestTracks, ...customTracks]) map.set(t.id, t)
    return [...map.values()]
  }, [manifestTracks, customTracks])

  const trackMap = useMemo(() => {
    const m = new Map()
    tracks.forEach((t) => m.set(t.id, t))
    return m
  }, [tracks])

  const queueTracks = useMemo(() => queue.map((id) => trackMap.get(id)).filter(Boolean), [queue, trackMap])

  const resolveTheme = useCallback(() => {
    if (theme === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }
    return theme
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolveTheme())
  }, [resolveTheme])

  useEffect(() => {
    if (!audioReady) return
    setMasterVolume(masterVolume)
  }, [audioReady, masterVolume, setMasterVolume])

  useEffect(() => {
    setEq(eq.bass, eq.mid, eq.treble)
  }, [eq, setEq])

  const handleMasterVolume = useCallback((v) => {
    const next = clamp(v, 0, 1.5)
    setMasterVolumeState(next)
    if (audioReady) setMasterVolume(next)
  }, [audioReady, setMasterVolume, setMasterVolumeState])

  const handleStop = useCallback(() => {
    stop()
    setDeckState('stopped')
  }, [stop])

  const loadTrackCode = useCallback(async (track) => {
    if (track.custom && track.code) {
      return track.code
    }
    const res = await fetch(track.file)
    if (!res.ok) throw new Error(`Cannot load ${track.file} (${res.status})`)
    return res.text()
  }, [])

  const handlePlay = useCallback(async () => {
    if (!loadedCode || !ready) return
    setMsg(null)
    try {
      await warmup(loadedSamples)
      await play(loadedCode)
      setDeckState('playing')
    } catch (e) {
      setMsg({ type: 'err', text: e.message })
    }
  }, [loadedCode, loadedSamples, ready, play, warmup])

  const handlePause = useCallback(() => {
    stop()
    setDeckState('paused')
  }, [stop])

  const handleCps = useCallback((v) => {
    const c = clamp(v, 0.05, 1.0)
    setCpsState(c)
    setCps(c)
  }, [setCps])

  const handleLoadAndPlay = useCallback(async (track) => {
    handleStop()
    setLoadedTrack(track)
    setLoadedCode(null)
    setLoadedSamples([])
    setLoading(true)
    setMsg({ type: 'wait', text: `Loading ${track.title}…` })
    try {
      let code = await loadTrackCode(track)
      code = code.replace(/^setcps\([^)]*\)\n?/m, '')
      const selectors = extractSampleSelectors(code)
      setLoadedCode(code)
      setLoadedSamples(selectors)
      setMsg(null)
      await warmup(selectors)
      await play(code)
      setDeckState('playing')
    } catch (e) {
      setMsg({ type: 'err', text: e.message })
    } finally {
      setLoading(false)
    }
  }, [handleStop, loadTrackCode, warmup, play])

  const handleLoad = useCallback(async (track) => {
    handleStop()
    setLoadedTrack(track)
    setLoadedCode(null)
    setLoadedSamples([])
    setLoading(true)
    setMsg({ type: 'wait', text: `Loading ${track.title}…` })
    try {
      let code = await loadTrackCode(track)
      code = code.replace(/^setcps\([^)]*\)\n?/m, '')
      const selectors = extractSampleSelectors(code)
      setLoadedCode(code)
      setLoadedSamples(selectors)
      setMsg(null)
    } catch (e) {
      setMsg({ type: 'err', text: e.message })
    } finally {
      setLoading(false)
    }
  }, [handleStop, loadTrackCode])

  const radio = useRadioMode({ tracks, onLoadAndPlay: handleLoadAndPlay, onStop: handleStop, rjVolume })

  const handleRadioLoad = useCallback((track) => {
    if (radio.enabled) {
      const idx = Math.max(0, tracks.findIndex((t) => t.id === track.id))
      radio.start(idx)
    } else {
      handleLoad(track)
    }
  }, [radio, tracks, handleLoad])

  useEffect(() => {
    if (deckState === 'playing') setCps(cps)
  }, [cps, deckState, setCps])

  const playNextFromQueue = useCallback(async () => {
    const item = dequeue(queue)
    if (!item.next) return false
    const nextTrack = trackMap.get(item.next)
    if (!nextTrack) {
      setQueue(item.queue)
      return false
    }
    setQueue(item.queue)
    await handleLoadAndPlay(nextTrack)
    return true
  }, [queue, setQueue, trackMap, handleLoadAndPlay])

  useEffect(() => {
    if (deckState !== 'playing' || radio.enabled || !queue.length) return undefined
    const ms = (loadedTrack?.durationSec || 180) * 1000
    const t = setTimeout(() => {
      if (!looping) playNextFromQueue()
    }, ms)
    return () => clearTimeout(t)
  }, [deckState, radio.enabled, queue.length, loadedTrack?.durationSec, looping, playNextFromQueue])

  const handleExport = useCallback(async () => {
    if (exporting) {
      const result = stopWavCapture()
      setExporting(false)
      if (!result?.blob) {
        setMsg({ type: 'err', text: 'No export audio captured.' })
        return
      }
      const stem = (loadedTrack?.title || 'track').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      downloadBlob(result.blob, `${stem || 'synthreel-track'}.wav`)
      setMsg({ type: 'wait', text: 'Export complete: WAV downloaded.' })
      return
    }

    const ok = startWavCapture()
    if (!ok) {
      setMsg({ type: 'err', text: 'Audio export unavailable in this browser/session.' })
      return
    }
    setExporting(true)
    setMsg({ type: 'wait', text: 'Recording export started. Click Export WAV again to stop.' })
  }, [exporting, stopWavCapture, loadedTrack?.title, startWavCapture])

  const playRelativeTrack = useCallback((delta) => {
    if (!tracks.length) return
    const currentIdx = loadedTrack ? tracks.findIndex((t) => t.id === loadedTrack.id) : 0
    const nextIdx = currentIdx < 0 ? 0 : (currentIdx + delta + tracks.length) % tracks.length
    handleLoadAndPlay(tracks[nextIdx])
  }, [tracks, loadedTrack, handleLoadAndPlay])

  const handleNextTrack = useCallback(async () => {
    const playedFromQueue = await playNextFromQueue()
    if (!playedFromQueue) {
      playRelativeTrack(1)
    }
  }, [playNextFromQueue, playRelativeTrack])

  const shortcuts = useMemo(() => ({
    ' ': () => {
      if (deckState === 'playing') handlePause()
      else handlePlay()
    },
    s: handleStop,
    n: () => {
      void handleNextTrack()
    },
    p: () => playRelativeTrack(-1),
    l: () => setLooping((v) => !v),
    '=': () => handleCps(cps + 0.02),
    '+': () => handleCps(cps + 0.02),
    '-': () => handleCps(cps - 0.02),
    h: () => setShowShortcuts((v) => !v),
    t: () => setTheme((v) => {
      const r = v === 'system' ? resolveTheme() : v
      return r === 'dark' ? 'light' : 'dark'
    }),
  }), [deckState, handlePause, handlePlay, handleStop, handleNextTrack, handleCps, cps, resolveTheme, setTheme])

  useKeyboardShortcuts(shortcuts)

  const engineState = initializing ? 'wait' : error ? 'err' : ready ? 'ok' : 'wait'
  const engineLabel = initializing ? 'LOADING…' : error ? 'ENGINE ERROR' : ready ? 'ENGINE READY' : 'OFFLINE'

  const saveDraftTune = useCallback(() => {
    if (!draftTune.code.trim()) {
      setMsg({ type: 'err', text: 'Tune code cannot be empty.' })
      return
    }
    const id = `custom-${Date.now()}`
    const item = normalizeTrack({
      id,
      title: draftTune.title,
      description: draftTune.description,
      code: draftTune.code,
      custom: true,
      key: draftTune.key,
      bpm: draftTune.bpm,
      durationSec: draftTune.durationSec,
      moodTags: draftTune.moodTags.split(',').map((s) => s.trim()).filter(Boolean),
      color: '#1d274a',
      accent: '#7ab2ff',
      emoji: '🧪',
    })
    setCustomTunes((prev) => [...prev, item])
    setMsg({ type: 'wait', text: `Saved custom tune: ${item.title}` })
  }, [draftTune, setCustomTunes])

  const playDraftTune = useCallback(async () => {
    const track = normalizeTrack({
      id: '__draft__',
      title: draftTune.title || 'Draft Tune',
      description: draftTune.description || 'Unsaved draft',
      key: draftTune.key,
      bpm: draftTune.bpm,
      durationSec: draftTune.durationSec,
      moodTags: draftTune.moodTags.split(',').map((s) => s.trim()).filter(Boolean),
      code: draftTune.code,
      custom: true,
      color: '#1f2f35',
      accent: '#4ad9bd',
      emoji: '📝',
    })
    await handleLoadAndPlay(track)
  }, [draftTune, handleLoadAndPlay])

  return (
    <div className="app">
      <header className="app-hd">
        <div className="logo">
          <span className="logo-icon">📼</span>
          <span className="logo-name">SYNTHREEL</span>
        </div>
        <div className="hd-tools">
          <button className="mini-btn" onClick={() => setShowEditor((v) => !v)}>Editor</button>
          <button className="mini-btn" onClick={() => setShowShortcuts((v) => !v)}>Shortcuts</button>
          <button className="mini-btn" onClick={() => setTheme((v) => {
            const r = v === 'system' ? resolveTheme() : v
            return r === 'dark' ? 'light' : 'dark'
          })}>Theme</button>
          <div className={`eng eng--${engineState}`}>
            <span className="eng-led" />
            <span className="eng-txt">{engineLabel}</span>
          </div>
        </div>
      </header>

      {showShortcuts && (
        <section className="shortcuts">
          <strong>Keyboard:</strong> Space play/pause, S stop, N/P next/prev, +/- tempo, L loop, T theme, H toggle help.
        </section>
      )}

      <TuneEditor open={showEditor} draft={draftTune} onDraft={setDraftTune} onClose={() => setShowEditor(false)} onSave={saveDraftTune} onPlay={playDraftTune} />

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
        onLoop={() => setLooping((l) => !l)}
        onCps={handleCps}
        rjVolume={rjVolume}
        onRjVolume={setRjVolume}
        radioEnabled={radio.enabled}
        radioPhase={radio.phase}
        radioTimeLeft={radio.timeLeft}
        onRadioToggle={() => {
          const idx = Math.max(0, loadedTrack ? tracks.findIndex((t) => t.id === loadedTrack.id) : 0)
          radio.toggle(idx)
        }}
        visualMode={visualMode}
        onVisualMode={setVisualMode}
        analyser={getAnalyser()}
        masterVolume={masterVolume}
        onMasterVolume={handleMasterVolume}
        eq={eq}
        onEq={setEqState}
        onExport={handleExport}
        exporting={exporting}
        audioReady={audioReady}
      />

      {msg && <div className={`app-msg app-msg--${msg.type}`}>{msg.text}</div>}

      {loadedCode && deckState !== 'playing' && !loading && (
        <button className="play-hint" onClick={handlePlay} disabled={!ready}>▶ PLAY — {loadedTrack?.title}</button>
      )}

      <QueuePanel
        queueTracks={queueTracks}
        onRemove={(idx) => setQueue((q) => removeFromQueue(q, idx))}
        onMove={(from, to) => setQueue((q) => moveQueueItem(q, from, to))}
        onClear={() => setQueue([])}
        onPlayNow={(idx) => {
          const id = queue[idx]
          const t = trackMap.get(id)
          if (!t) return
          setQueue((q) => removeFromQueue(q, idx))
          handleLoadAndPlay(t)
        }}
      />

      <Rack
        tracks={tracks}
        loadedId={loadedTrack?.id}
        playing={deckState === 'playing'}
        onLoad={handleRadioLoad}
        radioEnabled={radio.enabled}
        favorites={favorites}
        onFavorite={(trackId) => setFavorites((prev) => toggleFavorite(prev, trackId))}
        onQueue={(trackId) => setQueue((prev) => enqueue(prev, trackId))}
        onlyFavorites={onlyFavorites}
        onToggleFavorites={() => setOnlyFavorites((v) => !v)}
      />

      <footer className="app-ft">
        <span>Powered by <a href="https://strudel.cc" target="_blank" rel="noreferrer">Strudel</a></span>
        <span className="ft-dot">·</span>
        <a href="https://github.com/dattaprasad-r-ekavade/BinaryRadio" target="_blank" rel="noreferrer">Source code</a>
        <span className="ft-dot">·</span>
        <span>Favorites, queue, and custom tunes are saved locally</span>
      </footer>
    </div>
  )
}
