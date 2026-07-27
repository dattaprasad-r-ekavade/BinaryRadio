import PropTypes from 'prop-types'
import './TuneEditor.css'

export default function TuneEditor({ open, draft, onDraft, onClose, onSave, onPlay }) {
  if (!open) return null
  return (
    <section className="editor">
      <header className="editor-hd">
        <span>CUSTOM TUNE EDITOR</span>
        <button className="mini-btn" onClick={onClose}>
          Close
        </button>
      </header>
      <div className="editor-meta">
        <input
          value={draft.title}
          onChange={(e) => onDraft({ ...draft, title: e.target.value })}
          placeholder="Title"
          aria-label="Tune title"
        />
        <input
          value={draft.description}
          onChange={(e) => onDraft({ ...draft, description: e.target.value })}
          placeholder="Description"
          aria-label="Tune description"
        />
        <input
          value={draft.key}
          onChange={(e) => onDraft({ ...draft, key: e.target.value })}
          placeholder="Key"
          aria-label="Musical key"
        />
        <input
          type="number"
          value={draft.bpm}
          onChange={(e) => onDraft({ ...draft, bpm: Number(e.target.value) || 96 })}
          placeholder="BPM"
          aria-label="Beats per minute"
        />
        <input
          type="number"
          value={draft.durationSec}
          onChange={(e) => onDraft({ ...draft, durationSec: Number(e.target.value) || 180 })}
          placeholder="Duration"
          aria-label="Duration in seconds"
        />
        <input
          value={draft.moodTags}
          onChange={(e) => onDraft({ ...draft, moodTags: e.target.value })}
          placeholder="Tags comma separated"
          aria-label="Mood tags, comma separated"
        />
      </div>
      <textarea
        value={draft.code}
        onChange={(e) => onDraft({ ...draft, code: e.target.value })}
        spellCheck="false"
        aria-label="Strudel pattern code"
      />
      <div className="editor-actions">
        <button className="mini-btn" onClick={onPlay}>
          Play Draft
        </button>
        <button className="mini-btn mini-btn--on" onClick={onSave}>
          Add To Rack
        </button>
      </div>
    </section>
  )
}

TuneEditor.propTypes = {
  open: PropTypes.bool.isRequired,
  draft: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    key: PropTypes.string,
    bpm: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    durationSec: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    moodTags: PropTypes.string,
    code: PropTypes.string,
  }).isRequired,
  onDraft: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onPlay: PropTypes.func.isRequired,
}
