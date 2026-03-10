import { Suspense, lazy } from 'react'
import Deck from './components/Deck'
import HelpModal from './components/HelpModal'
import QueuePanel from './components/QueuePanel'
import Rack from './components/Rack'
import { usePlayerState } from './hooks/usePlayerState'
import './App.css'

const TuneEditor = lazy(() => import('./components/TuneEditor'))

export default function App() {
  const p = usePlayerState()
  const { transport, library, queue, ui } = p
  const srStatus = transport.loadedTrack
    ? `${transport.deckState} ${transport.loadedTrack.title}`
    : transport.deckState

  return (
    <div
      className="app"
      data-audio-ready={transport.audioReady ? 'true' : 'false'}
      data-deck-state={transport.deckState}
    >
      <header className="app-hd">
        <div className="logo">
          <span className="logo-icon">📼</span>
          <span className="logo-name">SYNTHREEL</span>
        </div>
        <div className="hd-tools">
          <button className="mini-btn" onClick={() => ui.actions.setShowEditor((v) => !v)}>
            Editor
          </button>
          <button className="mini-btn" onClick={() => ui.actions.setShowShortcuts((v) => !v)}>
            Shortcuts
          </button>
          <button className="mini-btn" onClick={ui.actions.toggleTheme}>
            Theme
          </button>
          {ui.installPromptEvent && (
            <button className="mini-btn" onClick={ui.actions.install}>
              Install
            </button>
          )}
          <div className={`eng eng--${ui.engineState}`}>
            <span className="eng-led" />
            <span className="eng-txt">{ui.engineLabel}</span>
          </div>
        </div>
      </header>

      <HelpModal open={ui.showShortcuts} onClose={() => ui.actions.setShowShortcuts(false)} />

      <Suspense fallback={null}>
        <TuneEditor
          open={ui.showEditor}
          draft={ui.draftTune}
          onDraft={ui.actions.setDraftTune}
          onClose={() => ui.actions.setShowEditor(false)}
          onSave={ui.actions.saveDraftTune}
          onPlay={ui.actions.playDraftTune}
        />
      </Suspense>

      <Deck
        track={transport.loadedTrack}
        playing={transport.deckState === 'playing'}
        paused={transport.deckState === 'paused'}
        looping={transport.looping}
        cps={transport.cps}
        ready={transport.ready}
        onPlay={transport.actions.play}
        onPause={transport.actions.pause}
        onStop={transport.actions.stop}
        onLoop={transport.actions.toggleLooping}
        onCps={transport.actions.setCps}
        rjVolume={transport.rjVolume}
        onRjVolume={transport.actions.setRjVolume}
        radioEnabled={transport.radio.enabled}
        radioPhase={transport.radio.phase}
        radioTimeLeft={transport.radio.timeLeft}
        onRadioToggle={transport.actions.radioToggle}
        visualMode={transport.visualMode}
        onVisualMode={transport.actions.setVisualMode}
        analyser={transport.analyser}
        masterVolume={ui.masterVolume}
        onMasterVolume={transport.actions.setMasterVolume}
        eq={ui.eq}
        onEq={ui.actions.setEq}
        onExport={transport.actions.exportWav}
        exporting={transport.exporting}
        audioReady={transport.audioReady}
      />

      <p className="sr-only" aria-live="polite">
        {srStatus}
      </p>

      {transport.msg && <div className={`app-msg app-msg--${transport.msg.type}`}>{transport.msg.text}</div>}

      {transport.loadedCode && transport.deckState !== 'playing' && !transport.loading && (
        <button className="play-hint" onClick={transport.actions.play} disabled={!transport.ready}>
          ▶ PLAY — {transport.loadedTrack?.title}
        </button>
      )}

      <QueuePanel
        queueTracks={queue.tracks}
        onRemove={queue.actions.remove}
        onMove={queue.actions.move}
        onClear={queue.actions.clear}
        onPlayNow={queue.actions.playNow}
      />

      <Rack
        tracks={library.tracks}
        loadedId={transport.loadedTrack?.id}
        playing={transport.deckState === 'playing'}
        onLoad={transport.actions.radioLoad}
        radioEnabled={transport.radio.enabled}
        favorites={library.favorites}
        onFavorite={library.actions.toggleFavorite}
        onQueue={library.actions.queueTrack}
        onlyFavorites={library.onlyFavorites}
        onToggleFavorites={library.actions.toggleOnlyFavorites}
      />

      <footer className="app-ft">
        <span>
          Powered by{' '}
          <a href="https://strudel.cc" target="_blank" rel="noreferrer">
            Strudel
          </a>
        </span>
        <span className="ft-dot">·</span>
        <a href="https://github.com/dattaprasad-r-ekavade/BinaryRadio" target="_blank" rel="noreferrer">
          Source code
        </a>
        <span className="ft-dot">·</span>
        <span>Favorites, queue, and custom tunes are saved locally</span>
      </footer>
    </div>
  )
}
