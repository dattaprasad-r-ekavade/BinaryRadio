// @ts-nocheck — react-three-fiber scene component; typed migration tracked with the other audio/visual refs
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import Room from './Room'
import Effects from './Effects'
import Shelves from './Shelves'
import Counter from './Counter'
import KeyboardStation from './KeyboardStation'
import { VIEWPOINTS } from './shopLayout'
import { useLook } from './looks/useLook'
import './Shop.css'

const VIEW_ORDER = ['overview', 'shelves', 'counter', 'keyboard']
const VIEW_ICONS = { overview: '🏪', shelves: '📼', counter: '🎛️', keyboard: '🎹' }
const INTRO_KEY = 'synthreel.shopIntro.v1'

/** One plain sentence per area: what you can do here, right now. */
function guideFor(view, { loaded, playing, ready }) {
  switch (view) {
    case 'shelves':
      return 'Click any cassette to pick it up, then press “Play this tape”.'
    case 'counter':
      if (!loaded) return 'The deck is empty. Go to “Browse tapes” and pick one first.'
      if (!ready) return 'The audio engine is still loading or offline, so the deck cannot play yet.'
      return playing
        ? 'Playing. Use the big buttons below, or the STOP / PAUSE keys on the deck.'
        : 'Press Play below, or the PLAY key on the deck.'
    case 'keyboard':
      return 'Click the keys, or type A S D F G H J K (Z / X change octave). Scale lock keeps every note in the tape’s key.'
    default:
      return 'Click the shelves, the deck or the keyboard to walk over. Drag to look around.'
  }
}

function readIntroSeen() {
  try {
    return localStorage.getItem(INTRO_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * The 3D cassette shop. A second view on the same player state as the
 * classic deck: every control here calls the existing transport, queue and
 * library actions.
 *
 * Layout: a top bar (areas + a one-line guide), the 3D stage, and a bottom
 * now-playing bar. Nothing permanent sits over the scene.
 */
export default function ShopView({ player }) {
  const { transport, library } = player
  const look = useLook()
  const [view, setView] = useState('overview')
  const [picked, setPicked] = useState(null)
  const [finderOpen, setFinderOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [introOpen, setIntroOpen] = useState(() => !readIntroSeen())
  const [hoverLabel, setHoverLabel] = useState(null)
  const [scaleLock, setScaleLock] = useState(false)
  const tipRef = useRef(null)
  const controls = useRef(null)
  const firstMove = useRef(false) // the first placement snaps; later moves animate
  // Set once the canvas has mounted CameraControls (it mounts after this component's effects run).
  const [controlsReady, setControlsReady] = useState(false)

  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  useEffect(() => {
    const v = VIEWPOINTS[view]
    controls.current?.setLookAt(...v.position, ...v.target, controlsReady && !reducedMotion && firstMove.current)
    if (controls.current) firstMove.current = true
  }, [view, reducedMotion, controlsReady])

  const closeIntro = useCallback((next) => {
    setIntroOpen(false)
    try {
      localStorage.setItem(INTRO_KEY, '1')
    } catch {
      // private mode: the intro just shows again next time
    }
    if (next) setView(next)
  }, [])

  // Esc closes the top-most panel, then goes back to the whole shop.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (introOpen) closeIntro()
      else if (finderOpen) setFinderOpen(false)
      else if (picked) setPicked(null)
      else setView('overview')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeIntro, finderOpen, introOpen, picked])

  // The hover label follows the pointer without re-rendering on every move.
  const onPointerMove = (e) => {
    const el = tipRef.current
    if (!el) return
    const box = e.currentTarget.getBoundingClientRect()
    el.style.transform = `translate(${e.clientX - box.left + 16}px, ${e.clientY - box.top + 18}px)`
  }

  const pick = (track) => {
    setPicked(track)
    setFinderOpen(false)
    setHoverLabel(null)
  }
  const listen = (track) => {
    void transport.actions.loadAndPlay(track)
    setPicked(null)
    setView('counter')
  }
  const goTo = (id) => {
    setView(id)
    setHoverLabel(null)
  }

  const loaded = transport.loadedTrack
  const playing = transport.deckState === 'playing'
  const isFav = picked ? library.favorites.includes(picked.id) : false
  const isQueued = picked ? (player.queue?.tracks || []).some((t) => t.id === picked.id) : false
  const guide = guideFor(view, { loaded, playing, ready: transport.ready })
  const results = library.tracks.filter((t) =>
    `${t.title} ${t.description} ${(t.moodTags || []).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const kicker = playing ? 'NOW PLAYING' : loaded ? (transport.deckState === 'paused' ? 'PAUSED' : 'ON THE DECK') : 'DECK EMPTY'

  // Area-level hover labels; the shelves report the exact tape.
  const area = (label, id) => ({
    onPointerOver: () => setHoverLabel((cur) => cur ?? label),
    onPointerOut: () => setHoverLabel(null),
    onClick: () => view !== id && goTo(id),
  })

  return (
    <div className="shop" data-look={look.id}>
      <div className="shop-top">
        <nav className="shop-nav" aria-label="Shop areas">
          {VIEW_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              className={view === id ? 'shop-chip shop-chip--on' : 'shop-chip'}
              aria-pressed={view === id}
              onClick={() => goTo(id)}
            >
              <span aria-hidden="true">{VIEW_ICONS[id]}</span> {VIEWPOINTS[id].label}
            </button>
          ))}
          <button type="button" className="shop-chip" onClick={() => setFinderOpen((v) => !v)} aria-expanded={finderOpen}>
            <span aria-hidden="true">🔍</span> Find a tape
          </button>
        </nav>
        <div className="shop-guide-row">
          <p className="shop-guide" role="status">
            <span className="shop-guide-icon" aria-hidden="true">
              💡
            </span>{' '}
            {guide}
          </p>
          {view === 'keyboard' && (
            <button
              type="button"
              className={scaleLock ? 'shop-chip shop-chip--on' : 'shop-chip'}
              aria-pressed={scaleLock}
              onClick={() => setScaleLock((v) => !v)}
              title="Snap every key to the notes of the tape on the deck"
            >
              Scale lock: {scaleLock ? 'On' : 'Off'}
            </button>
          )}
          <button type="button" className="shop-chip" onClick={() => setIntroOpen(true)}>
            <span aria-hidden="true">?</span> Help
          </button>
        </div>
      </div>

      <div className="shop-stage" onPointerMove={onPointerMove}>
        <Canvas
          className="shop-canvas"
          shadows
          dpr={[1, 1.75]}
          camera={{ fov: 48, position: VIEWPOINTS.overview.position, near: 0.05, far: 60 }}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          onPointerMissed={() => setPicked(null)}
        >
          <color attach="background" args={[look.background]} />
          <Suspense fallback={null}>
            <Room look={look} view={view} />
            <Shelves
              look={look}
              tracks={library.tracks}
              favorites={library.favorites}
              loadedId={loaded?.id}
              pickedId={picked?.id}
              onPick={pick}
              onHover={(t) => setHoverLabel(t ? `${t.title} — click to pick it up` : null)}
            />
            <group {...area(view === 'counter' ? 'Cassette deck' : 'Listening deck — click to walk over', 'counter')}>
              <Counter look={look} transport={transport} onFocus={() => goTo('counter')} />
            </group>
            <group {...area(view === 'keyboard' ? 'Keyboard — click a key' : 'Keyboard — click to play it', 'keyboard')}>
              <KeyboardStation
                look={look}
                trackKey={loaded?.key}
                active={view === 'keyboard'}
                onFocus={() => goTo('keyboard')}
                scaleLock={scaleLock}
                onScaleLockChange={setScaleLock}
              />
            </group>
            <Effects look={look} />
          </Suspense>
          <CameraControls
            ref={(c) => {
              controls.current = c
              if (c && !controlsReady) setControlsReady(true)
            }}
            makeDefault
            minDistance={0.6}
            maxDistance={7}
            maxPolarAngle={Math.PI * 0.52}
            dollySpeed={0.4}
            truckSpeed={0}
            smoothTime={0.6}
          />
        </Canvas>

        <div ref={tipRef} className={hoverLabel ? 'shop-tip shop-tip--on' : 'shop-tip'} aria-hidden="true">
          {hoverLabel}
        </div>

        {picked && (
          <aside className="shop-card" aria-label={`Tape: ${picked.title}`}>
            <button type="button" className="shop-card-close" onClick={() => setPicked(null)} aria-label="Put the tape back">
              ×
            </button>
            <div className="shop-card-head">
              <div className="shop-card-swatch" style={{ background: picked.color, borderColor: picked.accent }}>
                <span aria-hidden="true">{picked.emoji}</span>
              </div>
              <div className="shop-card-body">
                <h2 className="shop-card-title">{picked.title}</h2>
                <p className="shop-card-desc">{picked.description}</p>
                <p className="shop-card-meta">
                  {picked.bpm} BPM · key {picked.key} · about {Math.round((picked.durationSec || 0) / 60)} min
                </p>
              </div>
            </div>
            <button
              type="button"
              className="shop-btn shop-btn--primary shop-btn--big shop-btn--wide"
              onClick={() => listen(picked)}
              disabled={!transport.ready}
            >
              ▶ Play this tape
            </button>
            {!transport.ready && <p className="shop-card-note">The audio engine isn’t ready, so tapes can’t play yet.</p>}
            <div className="shop-card-actions">
              <button type="button" className="shop-btn" onClick={() => library.actions.queueTrack(picked.id)}>
                {isQueued ? '✓ Queued' : '+ Play next'}
              </button>
              <button
                type="button"
                className="shop-btn"
                aria-pressed={isFav}
                onClick={() => library.actions.toggleFavorite(picked.id)}
              >
                {isFav ? '★ Saved' : '☆ Save'}
              </button>
            </div>
          </aside>
        )}

        {finderOpen && (
          <aside className="shop-finder" aria-label="Find a tape">
            <input
              className="shop-finder-input"
              type="search"
              placeholder="Search tapes, moods…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <ul className="shop-finder-list">
              {results.map((t) => (
                <li key={t.id}>
                  <button type="button" className="shop-finder-item" onClick={() => pick(t)}>
                    <span className="shop-finder-dot" style={{ background: t.accent }} aria-hidden="true" />
                    <span className="shop-finder-name">{t.title}</span>
                    <span className="shop-finder-meta">
                      {t.bpm} BPM · {t.key}
                    </span>
                  </button>
                </li>
              ))}
              {!results.length && <li className="shop-finder-empty">No tapes match.</li>}
            </ul>
          </aside>
        )}
      </div>

      <div className="shop-now">
        <div className="shop-now-text">
          <span className="shop-now-kicker">{kicker}</span>
          <span className="shop-now-title">{loaded ? loaded.title : 'No tape loaded yet'}</span>
        </div>
        {loaded ? (
          <div className="shop-now-actions">
            <button
              type="button"
              className="shop-btn shop-btn--primary shop-btn--big"
              onClick={playing ? transport.actions.pause : transport.actions.play}
              disabled={!transport.ready}
              title={transport.ready ? undefined : 'The audio engine is not ready'}
            >
              {playing ? '❚❚ Pause' : '▶ Play'}
            </button>
            <button
              type="button"
              className="shop-btn shop-btn--big"
              onClick={transport.actions.stop}
              disabled={transport.deckState === 'stopped'}
            >
              ■ Stop
            </button>
          </div>
        ) : (
          <button type="button" className="shop-btn shop-btn--primary shop-btn--big" onClick={() => goTo('shelves')}>
            Browse tapes →
          </button>
        )}
      </div>

      {introOpen && (
        <div className="shop-intro" role="dialog" aria-modal="true" aria-labelledby="shop-intro-title">
          <div className="shop-intro-card">
            <h2 id="shop-intro-title" className="shop-intro-title">
              Welcome to SynthReel Tapes
            </h2>
            <p className="shop-intro-lead">A little cassette shop where every tape is music made from code.</p>
            <ol className="shop-intro-steps">
              <li>
                <span className="shop-intro-icon" aria-hidden="true">
                  📼
                </span>
                <span>
                  <strong>Pick a tape</strong> from the shelves.
                </span>
              </li>
              <li>
                <span className="shop-intro-icon" aria-hidden="true">
                  ▶
                </span>
                <span>
                  <strong>Press “Play this tape”</strong> and it goes on the deck.
                </span>
              </li>
              <li>
                <span className="shop-intro-icon" aria-hidden="true">
                  🎹
                </span>
                <span>
                  <strong>Play along</strong> on the keyboard.
                </span>
              </li>
            </ol>
            <p className="shop-intro-small">
              The buttons along the top take you around the shop. Prefer a simple player? Press <strong>Classic</strong> in
              the header.
            </p>
            <div className="shop-intro-actions">
              <button type="button" className="shop-btn shop-btn--primary shop-btn--big" onClick={() => closeIntro('shelves')}>
                Browse tapes →
              </button>
              <button type="button" className="shop-btn shop-btn--big" onClick={() => closeIntro()}>
                Look around first
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
