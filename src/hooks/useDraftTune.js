import { useCallback, useState } from 'react'
import { normalizeTrack } from '../utils/tunePipeline'

const INITIAL_DRAFT = {
  title: 'My Tune',
  description: 'Custom browser tune',
  key: 'Am',
  bpm: 96,
  durationSec: 180,
  moodTags: 'custom,ambient',
  code: 'setcps(0.25)\nstack([\n  note("c3 e3 g3").slow(2).s("triangle"),\n  s("bd sn").slow(2).gain(0.8)\n])',
}

export function useDraftTune({ handleLoadAndPlay, setCustomTunes, setMsg }) {
  const [draftTune, setDraftTune] = useState(INITIAL_DRAFT)

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
  }, [draftTune, setCustomTunes, setMsg])

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

  return { draftTune, setDraftTune, saveDraftTune, playDraftTune }
}
