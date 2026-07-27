import Knob from './Knob'
import Reel from './Reel'
import Visualizer from './Visualizer'
import VUMeter from './VUMeter'
import PropTypes from 'prop-types'
import './Deck.css'

const trackShape = PropTypes.shape({
  id: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  bpm: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  key: PropTypes.string,
  durationSec: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  moodTags: PropTypes.arrayOf(PropTypes.string),
  emoji: PropTypes.string,
})

const EQ_BANDS = [
  { id: 'bass', label: 'Bass' },
  { id: 'mid', label: 'Mid' },
  { id: 'treble', label: 'Treble' },
]

function formatDuration(seconds = 0) {
  const s = Math.max(0, Number(seconds) || 0)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

/* --------------------------------------------------------------------------
   Icons — drawn as SVG rather than typed as unicode glyphs (⏏ ⟳ ◀◀ 💾).
   Glyph coverage varies wildly between platforms; several rendered as tofu.
   -------------------------------------------------------------------------- */

const Icon = {
  stop: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="5" y="5" width="10" height="10" rx="1" fill="currentColor" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M6 4l10 6-10 6z" fill="currentColor" />
    </svg>
  ),
  pause: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M6 4h3v12H6zM11 4h3v12h-3z" fill="currentColor" />
    </svg>
  ),
  loop: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 8a4 4 0 014-4h5" />
        <path d="M16 12a4 4 0 01-4 4H7" />
      </g>
      <path d="M12 1.5L15.5 4 12 6.5z" fill="currentColor" />
      <path d="M8 13.5L4.5 16 8 18.5z" fill="currentColor" />
    </svg>
  ),
  record: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="5" fill="currentColor" />
    </svg>
  ),
  save: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M4 3h9l3 3v11H4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7 3h6v4H7zM6 11h8v6H6z" fill="currentColor" />
    </svg>
  ),
  eject: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 5l7 8H5z" fill="currentColor" />
      <rect x="5" y="15" width="14" height="2.5" rx="1" fill="currentColor" />
    </svg>
  ),
}

function TBtn({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  variant = '',
  pressed = undefined,
}) {
  let cls = 'tbtn'
  if (variant) cls += ` tbtn--${variant}`
  if (active) cls += ' tbtn--active'
  return (
    <button
      type="button"
      className={cls}
      onClick={onClick}
      disabled={!!disabled}
      aria-pressed={pressed}
    >
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
      {!!track.moodTags?.length && <span>{track.moodTags.join(' · ')}</span>}
    </div>
  )
}

/**
 * Single EQ band. Kept as a native range input for keyboard and AT support,
 * but fully restyled — the browser default thumb was the most obviously
 * off-theme element on the page. Double-click / Enter on the label resets to 0.
 */
function EqBand({ id, label, value, onChange }) {
  /* The band is bipolar (-12…+12 dB), so the fill runs from the 0 dB centre
     out to the thumb. A left-anchored fill made "flat" look half-applied. */
  const pct = ((value + 12) / 24) * 100
  const lo = Math.min(50, pct)
  const hi = Math.max(50, pct)
  return (
    <div className="eq-band">
      <div className="eq-band-hd">
        <label htmlFor={`eq-${id}`}>{label}</label>
        <button
          type="button"
          className="eq-reset"
          onClick={() => onChange(0)}
          disabled={value === 0}
          title={`Reset ${label} to 0 dB`}
          aria-label={`Reset ${label} to 0 decibels`}
        >
          {value > 0 ? `+${value}` : value} dB
        </button>
      </div>
      <div className="eq-track" style={{ '--lo': `${lo}%`, '--hi': `${hi}%` }}>
        <span className="eq-detent" aria-hidden="true" />
        <input
          id={`eq-${id}`}
          className="eq-input"
          type="range"
          min="-12"
          max="12"
          step="1"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onDoubleClick={() => onChange(0)}
          aria-valuetext={`${value} decibels`}
        />
      </div>
    </div>
  )
}

TBtn.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  variant: PropTypes.string,
  pressed: PropTypes.bool,
}

MetadataPills.propTypes = { track: trackShape }

EqBand.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default function Deck({
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
  onRadioSkip,
  visualMode,
  onVisualMode,
  analyser,
  channelAnalysers = /** @type {{ left?: any, right?: any } | null} */ (null),
  masterVolume,
  onMasterVolume,
  eq,
  onEq,
  onExport,
  exporting,
  exportHint,
  audioReady,
  deckState,
}) {
  const bpm = Math.round(cps * 60 * 4)
  const loaded = !!track
  const state = playing ? 'playing' : paused ? 'paused' : 'stopped'
  const stateLabel = playing ? 'PLAYING' : paused ? 'PAUSED' : 'STOPPED'

  return (
    <section className="deck" aria-label="Cassette deck">
      {/* Model plate. The wordmark lives in the page header; repeating it here
          was pure duplication, so this row now carries the view controls. */}
      <div className="deck-plate">
        <span className="deck-plate-model">SR-01 · CASSETTE DECK</span>
        <div className="viz-mode" role="group" aria-label="Visualizer mode">
          <button
            type="button"
            className={visualMode === 'spectrum' ? 'mini-btn mini-btn--on' : 'mini-btn'}
            onClick={() => onVisualMode('spectrum')}
            aria-pressed={visualMode === 'spectrum'}
          >
            Spectrum
          </button>
          <button
            type="button"
            className={visualMode === 'waveform' ? 'mini-btn mini-btn--on' : 'mini-btn'}
            onClick={() => onVisualMode('waveform')}
            aria-pressed={visualMode === 'waveform'}
          >
            Wave
          </button>
        </div>
      </div>

      <div className="deck-vizwrap">
        <Visualizer analyser={analyser} mode={visualMode} playing={playing} />
      </div>

      <div className="deck-win">
        <Reel spin={playing} size={54} />
        <div className="deck-info">
          {track ? (
            <>
              <div className="deck-playing-label">
                <span className={`deck-dot deck-dot--${state}`} aria-hidden="true" />
                {stateLabel}
              </div>
              <h2 className="deck-track">
                <span className="deck-emoji" aria-hidden="true">
                  {track.emoji}
                </span>
                {track.title}
              </h2>
              <p className="deck-desc">{track.description}</p>
              <MetadataPills track={track} />
            </>
          ) : (
            <>
              <span className="deck-eject-ico" aria-hidden="true">
                {Icon.eject}
              </span>
              <p className="deck-idle">NO TAPE</p>
              <p className="deck-idle-sub">Pick a cassette from the rack below</p>
            </>
          )}
        </div>
        <Reel spin={playing} size={54} />
      </div>

      <div className="deck-vu" aria-hidden="true">
        <VUMeter analyser={channelAnalysers?.left} active={playing} ch="L" />
        <VUMeter analyser={channelAnalysers?.right} active={playing} ch="R" />
      </div>

      <div className="deck-transport">
        <TBtn
          icon={Icon.stop}
          label="STOP"
          onClick={onStop}
          active={loaded && state === 'stopped'}
          disabled={!loaded}
        />
        <TBtn
          icon={playing ? Icon.pause : Icon.play}
          label={playing ? 'PAUSE' : 'PLAY'}
          onClick={playing ? onPause : onPlay}
          active={playing}
          disabled={!loaded || !ready}
          variant="play"
        />
        <TBtn
          icon={Icon.loop}
          label="LOOP"
          onClick={onLoop}
          active={looping}
          pressed={looping}
          variant="loop"
        />
        <TBtn
          icon={exporting ? Icon.save : Icon.record}
          label={exporting ? 'SAVE WAV' : 'START REC'}
          onClick={onExport}
          disabled={!loaded || !ready}
          active={exporting}
          pressed={exporting}
          variant="rec"
        />
      </div>

      {/* Radio is a mode switch, not a transport button, so it gets its own row
          instead of floating inside the tape window. */}
      <div className="deck-radio-row">
        <button
          type="button"
          className={radioEnabled ? 'mini-btn mini-btn--on' : 'mini-btn'}
          onClick={onRadioToggle}
          disabled={!ready}
          aria-pressed={radioEnabled}
        >
          RJ Radio
        </button>
        {radioEnabled && (
          <>
            <button
              type="button"
              className="mini-btn"
              onClick={onRadioSkip}
              title="Skip to next RJ announcement"
            >
              Skip to RJ
            </button>
            <span className="radio-status" aria-live="polite">
              {radioPhase === 'announcing' ? 'DJ' : 'Music'} · {Math.max(0, radioTimeLeft)}s
            </span>
          </>
        )}
      </div>

      {/* Collapsed by default: three lines of instructions permanently wedged
          between the transport and the knobs was the page's worst hierarchy
          problem. It auto-opens while a recording is in progress. */}
      {loaded && (
        <details
          className={exporting ? 'export-hint export-hint--active' : 'export-hint'}
          open={exporting}
        >
          <summary className="export-hint-summary">
            <span className="export-hint-title">WAV export</span>
            <span className="export-hint-state">
              {exporting ? 'Recording…' : 'How it works'}
            </span>
          </summary>
          <div role="note" aria-label="WAV export instructions" aria-live="polite">
            <ol className="export-hint-steps">
              <li className={deckState === 'playing' ? 'export-hint-step--done' : ''}>Press PLAY</li>
              <li className={exporting ? 'export-hint-step--done' : ''}>
                {exporting ? 'Recording — tap Save WAV when done' : 'Tap Start Rec'}
              </li>
              <li>Tap Save WAV to download</li>
            </ol>
            <p className="export-hint-detail">{exportHint}</p>
            {!audioReady && ready && (
              <p className="export-hint-warn">Audio routing activates after the first PLAY.</p>
            )}
          </div>
        </details>
      )}

      <div className="deck-controls-grid">
        <div className="knob-card">
          <span className="knob-lbl">TEMPO</span>
          <Knob
            value={cps}
            min={0.05}
            max={1.0}
            onChange={onCps}
            trackColor="var(--green)"
            glowColor="var(--green-glow)"
            label="Tempo"
            valueText={`${cps.toFixed(2)} cycles per second, ${bpm} bpm`}
          />
          <span className="knob-val">{cps.toFixed(2)} cps</span>
          <span className="knob-sub">{bpm} bpm</span>
        </div>

        <div className="knob-card">
          <span className="knob-lbl">MASTER</span>
          <Knob
            value={masterVolume}
            min={0}
            max={1.5}
            onChange={onMasterVolume}
            trackColor="var(--blue)"
            glowColor="var(--blue-glow)"
            label="Master volume"
            valueText={`${Math.round(masterVolume * 100)} percent`}
          />
          <span className="knob-val">{Math.round(masterVolume * 100)}%</span>
          <span className="knob-sub">volume</span>
        </div>

        <div className="knob-card">
          <span className="knob-lbl">RJ VOLUME</span>
          <Knob
            value={rjVolume}
            min={0}
            max={1}
            onChange={onRjVolume}
            trackColor="var(--amber)"
            glowColor="var(--amber-glow)"
            label="Radio DJ volume"
            valueText={`${Math.round(rjVolume * 100)} percent`}
          />
          <span className="knob-val">{Math.round(rjVolume * 100)}%</span>
          <span className="knob-sub">announcements</span>
        </div>
      </div>

      <div className="eq-strip" role="group" aria-label="Equalizer">
        {EQ_BANDS.map(({ id, label }) => (
          <EqBand
            key={id}
            id={id}
            label={label}
            value={eq[id]}
            onChange={(next) => onEq({ ...eq, [id]: next })}
          />
        ))}
      </div>
    </section>
  )
}

Deck.propTypes = {
  track: trackShape,
  playing: PropTypes.bool.isRequired,
  paused: PropTypes.bool.isRequired,
  looping: PropTypes.bool.isRequired,
  cps: PropTypes.number.isRequired,
  ready: PropTypes.bool.isRequired,
  onPlay: PropTypes.func.isRequired,
  onPause: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  onLoop: PropTypes.func.isRequired,
  onCps: PropTypes.func.isRequired,
  rjVolume: PropTypes.number.isRequired,
  onRjVolume: PropTypes.func.isRequired,
  radioEnabled: PropTypes.bool.isRequired,
  radioPhase: PropTypes.string.isRequired,
  radioTimeLeft: PropTypes.number,
  onRadioToggle: PropTypes.func.isRequired,
  onRadioSkip: PropTypes.func.isRequired,
  visualMode: PropTypes.oneOf(['spectrum', 'waveform']).isRequired,
  onVisualMode: PropTypes.func.isRequired,
  analyser: PropTypes.shape({
    fftSize: PropTypes.number,
    frequencyBinCount: PropTypes.number,
    getByteFrequencyData: PropTypes.func,
    getByteTimeDomainData: PropTypes.func,
  }),
  channelAnalysers: PropTypes.shape({
    left: PropTypes.object,
    right: PropTypes.object,
  }),
  masterVolume: PropTypes.number.isRequired,
  onMasterVolume: PropTypes.func.isRequired,
  eq: PropTypes.shape({
    bass: PropTypes.number.isRequired,
    mid: PropTypes.number.isRequired,
    treble: PropTypes.number.isRequired,
  }).isRequired,
  onEq: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  exporting: PropTypes.bool.isRequired,
  exportHint: PropTypes.string,
  audioReady: PropTypes.bool,
  deckState: PropTypes.oneOf(['playing', 'paused', 'stopped']),
}
