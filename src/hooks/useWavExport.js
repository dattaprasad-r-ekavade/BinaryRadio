import { useCallback, useState } from 'react'

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

const EXPORT_HINT_IDLE =
  'Export: press PLAY so audio is running, then tap Start Recording. Tap Save WAV when finished.'
const EXPORT_HINT_RECORDING =
  'Recording… let the tune play, then tap Save WAV to download your file.'

export function useWavExport({
  startWavCapture,
  stopWavCapture,
  canExportAudio,
  audioReady,
  deckState,
  loadedTrack,
  setMsg,
}) {
  const [exporting, setExporting] = useState(false)

  const exportWav = useCallback(async () => {
    if (exporting) {
      setMsg({ type: 'wait', text: 'Finishing export…' })
      const result = await stopWavCapture()
      setExporting(false)
      if (!result?.blob) {
        setMsg({
          type: 'err',
          text: 'No audio captured. Play the track while recording, then try again.',
        })
        return
      }
      const stem = (loadedTrack?.title || 'track').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      downloadBlob(result.blob, `${stem || 'synthreel-track'}.wav`)
      setMsg({ type: 'wait', text: 'Export complete — WAV downloaded.' })
      return
    }

    if (!loadedTrack) {
      setMsg({ type: 'err', text: 'Load a cassette before exporting.' })
      return
    }

    if (deckState !== 'playing') {
      setMsg({
        type: 'err',
        text: 'Press PLAY first so audio is running, then start recording.',
      })
      return
    }

    if (!canExportAudio()) {
      setMsg({
        type: 'err',
        text: audioReady
          ? 'Audio export is not ready yet. Wait for ENGINE READY, play a track, then try again.'
          : 'Audio export unavailable — wait for ENGINE READY and play a track first.',
      })
      return
    }

    const ok = await startWavCapture()
    if (!ok) {
      setMsg({
        type: 'err',
        text: 'Could not start export recording. Refresh the page and try again after pressing PLAY.',
      })
      return
    }
    setExporting(true)
    setMsg({ type: 'wait', text: EXPORT_HINT_RECORDING })
  }, [
    audioReady,
    canExportAudio,
    deckState,
    exporting,
    loadedTrack,
    setMsg,
    startWavCapture,
    stopWavCapture,
  ])

  return {
    exporting,
    exportWav,
    exportHint: exporting ? EXPORT_HINT_RECORDING : EXPORT_HINT_IDLE,
  }
}
