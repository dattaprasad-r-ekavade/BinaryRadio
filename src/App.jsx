import { Suspense, lazy } from 'react'
import Deck from './components/Deck'
import HelpModal from './components/HelpModal'
import QueuePanel from './components/QueuePanel'
import Rack from './components/Rack'
import { usePlayerState } from './hooks/usePlayerState'
import './App.css'

const TuneEditor = lazy(() => import('./components/TuneEditor'))

/** Wordmark glyph. Was a 📼 emoji, which rendered as tofu wherever the
 *  platform emoji font lacked it, and could not be themed. */
function CassetteMark() {
  return (
    <svg className="logo-icon" viewBox="0 0 48 32" aria-hidden="true" focusable="false">
      <rect
        x="1"
        y="1"
        width="46"
        height="30"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="16" cy="15" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="15" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 15h16" stroke="currentColor" strokeWidth="2" />
      <path d="M12 26h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

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
          <CassetteMark />
          <span className="logo-name">SYNTHREEL</span>
        </div>
        <div className="hd-tools">
          <button
            type="button"
            className={ui.showEditor ? 'mini-btn mini-btn--on' : 'mini-btn'}
            onClick={() => ui.actions.setShowEditor((v) => !v)}
            aria-pressed={ui.showEditor}
          >
            Editor
          </button>
          <button
            type="button"
            className={ui.showShortcuts ? 'mini-btn mini-btn--on' : 'mini-btn'}
            onClick={() => ui.actions.setShowShortcuts((v) => !v)}
            aria-pressed={ui.showShortcuts}
          >
            Shortcuts
          </button>
          <button
            type="button"
            className="mini-btn"
            onClick={ui.actions.toggleTheme}
            aria-pressed={ui.resolvedTheme === 'light'}
            title={`Switch to ${ui.resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
          >
            {ui.resolvedTheme === 'light' ? 'Dark' : 'Light'}
          </button>
          {ui.installPromptEvent && (
            <button type="button" className="mini-btn" onClick={ui.actions.install}>
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

      {/* Moved above the deck: as a message *below* the transport it appeared
          after the controls it was describing, and shifted the layout. */}
      {transport.msg && (
        <div className={`app-msg app-msg--${transport.msg.type}`} role="status">
          {transport.msg.text}
        </div>
      )}

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
        onRadioSkip={transport.actions.radioSkip}
        visualMode={transport.visualMode}
        onVisualMode={transport.actions.setVisualMode}
        analyser={transport.analyser}
        channelAnalysers={transport.channelAnalysers}
        masterVolume={ui.masterVolume}
        onMasterVolume={transport.actions.setMasterVolume}
        eq={ui.eq}
        onEq={ui.actions.setEq}
        onExport={transport.actions.exportWav}
        exporting={transport.exporting}
        exportHint={transport.exportHint}
        audioReady={transport.audioReady}
        deckState={transport.deckState}
      />

      <p className="sr-only" aria-live="polite">
        {srStatus}
      </p>

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
        <a
          href="https://github.com/dattaprasad-r-ekavade/BinaryRadio"
          target="_blank"
          rel="noreferrer"
        >
          Source code
        </a>
        <span className="ft-dot">·</span>
        <span>Favorites, queue, and custom tunes are saved locally</span>
      </footer>
    </div>
  )
}
