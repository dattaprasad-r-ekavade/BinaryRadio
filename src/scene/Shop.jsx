// @ts-nocheck — react-three-fiber scene component; typed migration tracked with the other audio/visual refs
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import Room from './Room';
import Effects from './Effects';
import Shelves from './Shelves';
import Counter from './Counter';
import KeyboardStation from './KeyboardStation';
import { VIEWPOINTS } from './shopLayout';
import { useLook } from './looks/useLook';
import './Shop.css';

const VIEW_ORDER = ['overview', 'shelves', 'counter', 'keyboard'];

/**
 * The 3D cassette shop. A second view on the same player state as the
 * classic deck: every control here calls the existing transport, queue and
 * library actions.
 */
export default function ShopView({ player }) {
  const { transport, library } = player;
  const look = useLook();
  const [view, setView] = useState('overview');
  const [picked, setPicked] = useState(/** @type {any} */ (null));
  const [finderOpen, setFinderOpen] = useState(false);
  const [query, setQuery] = useState('');
  const controls = useRef(/** @type {any} */ (null));
  const firstMove = useRef(false); // the first placement snaps; later moves animate
  // Set once the canvas has mounted CameraControls (it mounts after this component's effects run).
  const [controlsReady, setControlsReady] = useState(false);

  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    const v = VIEWPOINTS[view];
    controls.current?.setLookAt(...v.position, ...v.target, controlsReady && !reducedMotion && firstMove.current);
    if (controls.current) firstMove.current = true;
  }, [view, reducedMotion, controlsReady]);

  // Esc goes back to the overview (or closes a panel first).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (finderOpen) setFinderOpen(false);
      else if (picked) setPicked(null);
      else setView('overview');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finderOpen, picked]);

  const pick = (track) => {
    setPicked(track);
    setFinderOpen(false);
  };
  const listen = (track) => {
    void transport.actions.loadAndPlay(track);
    setPicked(null);
    setView('counter');
  };
  const isFav = picked ? library.favorites.includes(picked.id) : false;
  const playing = transport.deckState === 'playing';
  const results = library.tracks.filter((t) =>
    `${t.title} ${t.description} ${(t.moodTags || []).join(' ')}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  return (
    <div className="shop" data-look={look.id}>
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
          <Room look={look} />
          <Shelves
            look={look}
            tracks={library.tracks}
            favorites={library.favorites}
            loadedId={transport.loadedTrack?.id}
            pickedId={picked?.id}
            onPick={pick}
          />
          <Counter look={look} transport={transport} onFocus={() => setView('counter')} />
          <KeyboardStation
            look={look}
            trackKey={transport.loadedTrack?.key}
            active={view === 'keyboard'}
            onFocus={() => setView('keyboard')}
          />
          <Effects look={look} />
        </Suspense>
        <CameraControls
          ref={(c) => {
            controls.current = c;
            if (c && !controlsReady) setControlsReady(true);
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

      <nav className="shop-nav" aria-label="Shop areas">
        {VIEW_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={view === id ? 'shop-chip shop-chip--on' : 'shop-chip'}
            aria-pressed={view === id}
            onClick={() => setView(id)}
          >
            {VIEWPOINTS[id].label}
          </button>
        ))}
        <button
          type="button"
          className="shop-chip"
          onClick={() => setFinderOpen((v) => !v)}
          aria-expanded={finderOpen}
        >
          Find a tape
        </button>
      </nav>

      {view === 'keyboard' && (
        <p className="shop-hint">
          Play with your keyboard: <kbd>A</kbd>–<kbd>;</kbd> for notes, <kbd>Z</kbd>/<kbd>X</kbd>{' '}
          for octave. Turn on SCALE LOCK to stay in the tape&apos;s key.
        </p>
      )}

      <div className="shop-now" role="status">
        <span className="shop-now-kicker">
          {playing ? 'NOW PLAYING' : transport.loadedTrack ? 'ON THE DECK' : 'DECK EMPTY'}
        </span>
        <span className="shop-now-title">
          {transport.loadedTrack ? transport.loadedTrack.title : 'Pick a tape from the shelves'}
        </span>
        {transport.loadedTrack && (
          <button
            type="button"
            className="shop-btn shop-btn--primary"
            onClick={playing ? transport.actions.pause : transport.actions.play}
            disabled={!transport.ready}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
        )}
      </div>

      {picked && (
        <aside className="shop-card" aria-label={`Tape: ${picked.title}`}>
          <div
            className="shop-card-swatch"
            style={{ background: picked.color, borderColor: picked.accent }}
          >
            <span aria-hidden="true">{picked.emoji}</span>
          </div>
          <div className="shop-card-body">
            <h2 className="shop-card-title">{picked.title}</h2>
            <p className="shop-card-desc">{picked.description}</p>
            <p className="shop-card-meta">
              {picked.bpm} BPM · {picked.key} · {Math.round((picked.durationSec || 0) / 60)} min
            </p>
            <p className="shop-card-tags">
              {(picked.moodTags || []).filter((t) => t !== 'v2').join(' · ')}
            </p>
            <div className="shop-card-actions">
              <button
                type="button"
                className="shop-btn shop-btn--primary"
                onClick={() => listen(picked)}
                disabled={!transport.ready}
              >
                Listen
              </button>
              <button
                type="button"
                className="shop-btn"
                onClick={() => library.actions.queueTrack(picked.id)}
              >
                Queue
              </button>
              <button
                type="button"
                className="shop-btn"
                aria-pressed={isFav}
                onClick={() => library.actions.toggleFavorite(picked.id)}
              >
                {isFav ? 'Held ★' : 'Hold'}
              </button>
              <button
                type="button"
                className="shop-btn shop-btn--ghost"
                onClick={() => setPicked(null)}
              >
                Put back
              </button>
            </div>
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
                  <span
                    className="shop-finder-dot"
                    style={{ background: t.accent }}
                    aria-hidden="true"
                  />
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
  );
}
