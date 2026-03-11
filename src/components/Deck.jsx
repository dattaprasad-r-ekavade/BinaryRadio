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

function formatDuration(seconds = 0) {
  const s = Math.max(0, Number(seconds) || 0)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

function TBtn({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  glow = false,
  variant = '',
  hidden = false,
}) {
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
      <span>{track.moodTags?.join(' Â· ')}</span>
    </div>
  )
}

TBtn.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  glow: PropTypes.bool,
  variant: PropTypes.string,
  hidden: PropTypes.bool,
}

MetadataPills.propTypes = {
  track: trackShape,
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
        <span className="deck-brand-model">SR-01 â—† CASSETTE DECK</span>
      </div>

      <div className="deck-vizwrap">
        <Visualizer analyser={analyser} mode={visualMode} playing={playing} />
        <div className="viz-mode">
          <button
            className={visualMode === 'spectrum' ? 'mini-btn mini-btn--on' : 'mini-btn'}
            onClick={() => onVisualMode('spectrum')}
          >
            Spectrum
          </button>
          <button
            className={visualMode === 'waveform' ? 'mini-btn mini-btn--on' : 'mini-btn'}
            onClick={() => onVisualMode('waveform')}
          >
            Wave
          </button>
        </div>
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
              <div className="deck-eject-ico">â</div>
              <div className="deck-idle">NO TAPE</div>
              <div className="deck-idle-sub">pick a cassette below</div>
            </>
          )}
          <div className={`deck-state deck-state--${state}`}>
            {state === 'playing' ? 'â— REC' : state === 'paused' ? 'â¸ PAUSED' : 'â–  STOPPED'}
          </div>
          <div className="deck-radio-row">
            <button
              className={radioEnabled ? 'mini-btn mini-btn--on' : 'mini-btn'}
              onClick={onRadioToggle}
              disabled={!audioReady}
            >
              RJ Radio
            </button>
            {radioEnabled && (
              <span className="radio-status">
                {radioPhase === 'announcing' ? 'DJ' : 'Music'} â€¢ {Math.max(0, radioTimeLeft)}s
              </span>
            )}
          </div>
        </div>
        <Reel spin={playing} size={52} />
      </div>

      <div className="deck-vu">
        <VUMeter active={playing} ch="L" />
        <VUMeter active={playing} ch="R" />
      </div>

      <div className="deck-transport">
        <TBtn
          icon="â– "
          label="STOP"
          onClick={onStop}
          active={!loaded ? false : state === 'stopped'}
          disabled={!loaded}
        />
        <TBtn icon="â—€â—€" label="REW" onClick={onStop} disabled={!loaded} hidden />
        <TBtn
          icon={playing ? 'â¸' : 'â–¶'}
          label={playing ? 'PAUSE' : 'PLAY'}
          onClick={playing ? onPause : onPlay}
          active={playing}
          glow={loaded && !playing && ready}
          disabled={!loaded || !ready}
          variant="play"
        />
        <TBtn icon="âŸ³" label="LOOP" onClick={onLoop} active={looping} variant="loop" />
        <TBtn
          icon={exporting ? 'â³' : 'â¬‡'}
          label={exporting ? 'EXPORTING' : 'EXPORT'}
          onClick={onExport}
          disabled={!loaded || exporting}
          variant="loop"
        />
      </div>

      <div className="deck-controls-grid">
        <div className="knob-card">
          <span className="knob-lbl">TEMPO</span>
          <Knob
            value={cps}
            min={0.05}
            max={1.0}
            onChange={onCps}
            trackColor="#00e87a"
            glowColor="rgba(0,232,122,.6)"
            dragTitle="Drag up/down to change tempo"
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
            trackColor="#4da3ff"
            glowColor="rgba(77,163,255,.6)"
            dragTitle="Master volume"
          />
          <span className="knob-val">{Math.round(masterVolume * 100)}%</span>
        </div>

        <div className="knob-card">
          <span className="knob-lbl">RJ VOLUME</span>
          <Knob
            value={rjVolume}
            min={0}
            max={1}
            onChange={onRjVolume}
            trackColor="#ffb703"
            glowColor="rgba(255,183,3,.6)"
            dragTitle="Radio DJ volume"
          />
          <span className="knob-val">{Math.round(rjVolume * 100)}%</span>
        </div>
      </div>

      <div className="eq-strip">
        <label>
          <span>BASS {eq.bass}dB</span>
          <input
            type="range"
            min="-12"
            max="12"
            value={eq.bass}
            onChange={(e) => onEq({ ...eq, bass: Number(e.target.value) })}
          />
        </label>
        <label>
          <span>MID {eq.mid}dB</span>
          <input
            type="range"
            min="-12"
            max="12"
            value={eq.mid}
            onChange={(e) => onEq({ ...eq, mid: Number(e.target.value) })}
          />
        </label>
        <label>
          <span>TREBLE {eq.treble}dB</span>
          <input
            type="range"
            min="-12"
            max="12"
            value={eq.treble}
            onChange={(e) => onEq({ ...eq, treble: Number(e.target.value) })}
          />
        </label>
      </div>
    </div>
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
  visualMode: PropTypes.oneOf(['spectrum', 'waveform']).isRequired,
  onVisualMode: PropTypes.func.isRequired,
  analyser: PropTypes.shape({
    fftSize: PropTypes.number,
    frequencyBinCount: PropTypes.number,
    getByteFrequencyData: PropTypes.func,
    getByteTimeDomainData: PropTypes.func,
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
  audioReady: PropTypes.bool.isRequired,
}
