import { useCallback, useState } from 'react'

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

export function useWavExport({ startWavCapture, stopWavCapture, loadedTrack, setMsg }) {
  const [exporting, setExporting] = useState(false)

  const exportWav = useCallback(async () => {
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
  }, [exporting, loadedTrack, setMsg, startWavCapture, stopWavCapture])

  return { exporting, exportWav }
}
