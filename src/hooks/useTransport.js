import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { useStrudel } from './useStrudel'
import { useRadioMode } from './useRadioMode'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import { normalizeTrack, preparePlaybackCode } from '../utils/tunePipeline'

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

const initialState = {
  loadedTrack: null,
  deckState: 'stopped',
  looping: true,
  cps: 0.25,
  loadedCode: null,
  loadedSamples: [],
  loading: false,
  msg: null,
  rjVolume: 0.6,
  visualMode: 'spectrum',
  exporting: false,
  showEditor: false,
  showShortcuts: false,
  installPromptEvent: null,
  draftTune: {
    title: 'My Tune',
    description: 'Custom browser tune',
    key: 'Am',
    bpm: 96,
    durationSec: 180,
    moodTags: 'custom,ambient',
    code: 'setcps(0.25)\nstack([\n  note("c3 e3 g3").slow(2).s("triangle"),\n  s("bd sn").slow(2).gain(0.8)\n])',
  },
}

function reducer(state, action) {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.payload }
    case 'set': {
      const prev = state[action.key]
      const next = typeof action.value === 'function' ? action.value(prev) : action.value
      return { ...state, [action.key]: next }
    }
    default:
      return state
  }
}

export function useTransport({
  tracks,
  queueIds,
  playNextFromQueue,
  onQueuePlayNow,
  masterVolume,
  setMasterVolumeState,
  eq,
  setEqState,
  theme,
  setTheme,
  setCustomTunes,
}) {
  const {
    ready,
    initializing,
    error,
    audioReady,
    play,
    stop,
    setCps,
    setMasterVolume,
    setEq,
    getAnalyser,
    startWavCapture,
    stopWavCapture,
    warmup,
  } = useStrudel()

  const [state, dispatch] = useReducer(reducer, initialState)
  const setField = useCallback((key, value) => dispatch({ type: 'set', key, value }), [])
  const patch = useCallback((payload) => dispatch({ type: 'patch', payload }), [])

  const resolveTheme = useCallback(() => {
    if (theme === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
    }
    return theme
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolveTheme())
  }, [resolveTheme])

  useEffect(() => {
    if (!audioReady) return
    setMasterVolume(masterVolume)
  }, [audioReady, masterVolume, setMasterVolume])

  useEffect(() => {
    setEq(eq.bass, eq.mid, eq.treble)
  }, [eq, setEq])

  const setMsg = useCallback((v) => setField('msg', v), [setField])

  const handleMasterVolume = useCallback(
    (v) => {
      const next = clamp(v, 0, 1.5)
      setMasterVolumeState(next)
      if (audioReady) setMasterVolume(next)
    },
    [audioReady, setMasterVolume, setMasterVolumeState],
  )

  const handleStop = useCallback(() => {
    stop()
    patch({ deckState: 'stopped' })
  }, [patch, stop])

  const loadTrackCode = useCallback(async (track) => {
    if (track.custom && track.code) return track.code
    const res = await fetch(track.file)
    if (!res.ok) throw new Error(`Cannot load ${track.file} (${res.status})`)
    return res.text()
  }, [])

  const handlePlay = useCallback(async () => {
    if (!state.loadedCode || !ready) return
    setMsg(null)
    try {
      await warmup(state.loadedSamples)
      await play(state.loadedCode)
      patch({ deckState: 'playing' })
    } catch (e) {
      setMsg({ type: 'err', text: e.message })
    }
  }, [patch, play, ready, setMsg, state.loadedCode, state.loadedSamples, warmup])

  const handlePause = useCallback(() => {
    stop()
    patch({ deckState: 'paused' })
  }, [patch, stop])

  const handleCps = useCallback(
    (v) => {
      const c = clamp(v, 0.05, 1.0)
      patch({ cps: c })
      setCps(c)
    },
    [patch, setCps],
  )

  const handleLoadAndPlay = useCallback(
    async (track) => {
      handleStop()
      patch({
        loadedTrack: track,
        loadedCode: null,
        loadedSamples: [],
        loading: true,
        msg: { type: 'wait', text: `Loading ${track.title}…` },
      })
      try {
        const rawCode = await loadTrackCode(track)
        const { code, selectors } = preparePlaybackCode(rawCode)
        patch({ loadedCode: code, loadedSamples: selectors, msg: null })
        await warmup(selectors)
        await play(code)
        patch({ deckState: 'playing' })
      } catch (e) {
        setMsg({ type: 'err', text: e.message })
      } finally {
        patch({ loading: false })
      }
    },
    [handleStop, loadTrackCode, patch, play, setMsg, warmup],
  )

  const handleLoad = useCallback(
    async (track) => {
      handleStop()
      patch({
        loadedTrack: track,
        loadedCode: null,
        loadedSamples: [],
        loading: true,
        msg: { type: 'wait', text: `Loading ${track.title}…` },
      })
      try {
        const rawCode = await loadTrackCode(track)
        const { code, selectors } = preparePlaybackCode(rawCode)
        patch({ loadedCode: code, loadedSamples: selectors, msg: null })
      } catch (e) {
        setMsg({ type: 'err', text: e.message })
      } finally {
        patch({ loading: false })
      }
    },
    [handleStop, loadTrackCode, patch, setMsg],
  )

  const radio = useRadioMode({ tracks, onLoadAndPlay: handleLoadAndPlay, onStop: handleStop, rjVolume: state.rjVolume })

  const handleRadioLoad = useCallback(
    (track) => {
      if (radio.enabled) {
        const idx = Math.max(0, tracks.findIndex((t) => t.id === track.id))
        radio.start(idx)
      } else {
        handleLoad(track)
      }
    },
    [handleLoad, radio, tracks],
  )

  useEffect(() => {
    if (state.deckState === 'playing') setCps(state.cps)
  }, [setCps, state.cps, state.deckState])

  useEffect(() => {
    if (state.deckState !== 'playing' || radio.enabled || !queueIds.length) return undefined
    const ms = (state.loadedTrack?.durationSec || 180) * 1000
    const t = setTimeout(() => {
      if (!state.looping) {
        void playNextFromQueue(handleLoadAndPlay)
      }
    }, ms)
    return () => clearTimeout(t)
  }, [handleLoadAndPlay, playNextFromQueue, queueIds.length, radio.enabled, state.deckState, state.loadedTrack?.durationSec, state.looping])

  const handleExport = useCallback(async () => {
    if (state.exporting) {
      const result = stopWavCapture()
      patch({ exporting: false })
      if (!result?.blob) {
        setMsg({ type: 'err', text: 'No export audio captured.' })
        return
      }
      const stem = (state.loadedTrack?.title || 'track').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      downloadBlob(result.blob, `${stem || 'synthreel-track'}.wav`)
      setMsg({ type: 'wait', text: 'Export complete: WAV downloaded.' })
      return
    }

    const ok = startWavCapture()
    if (!ok) {
      setMsg({ type: 'err', text: 'Audio export unavailable in this browser/session.' })
      return
    }
    patch({ exporting: true })
    setMsg({ type: 'wait', text: 'Recording export started. Click Export WAV again to stop.' })
  }, [patch, setMsg, startWavCapture, state.exporting, state.loadedTrack?.title, stopWavCapture])

  const playRelativeTrack = useCallback(
    (delta) => {
      if (!tracks.length) return
      const currentIdx = state.loadedTrack ? tracks.findIndex((t) => t.id === state.loadedTrack.id) : 0
      const nextIdx = currentIdx < 0 ? 0 : (currentIdx + delta + tracks.length) % tracks.length
      handleLoadAndPlay(tracks[nextIdx])
    },
    [handleLoadAndPlay, state.loadedTrack, tracks],
  )

  const handleNextTrack = useCallback(async () => {
    const playedFromQueue = await playNextFromQueue(handleLoadAndPlay)
    if (!playedFromQueue) playRelativeTrack(1)
  }, [handleLoadAndPlay, playNextFromQueue, playRelativeTrack])

  const shortcuts = useMemo(
    () => ({
      ' ': () => {
        if (state.deckState === 'playing') handlePause()
        else handlePlay()
      },
      s: handleStop,
      n: () => {
        void handleNextTrack()
      },
      p: () => playRelativeTrack(-1),
      l: () => setField('looping', (v) => !v),
      '=': () => handleCps(state.cps + 0.02),
      '+': () => handleCps(state.cps + 0.02),
      '-': () => handleCps(state.cps - 0.02),
      h: () => setField('showShortcuts', (v) => !v),
      t: () => {
        setTheme((v) => {
          const r = v === 'system' ? resolveTheme() : v
          return r === 'dark' ? 'light' : 'dark'
        })
      },
    }),
    [handleCps, handleNextTrack, handlePause, handlePlay, handleStop, playRelativeTrack, resolveTheme, setField, setTheme, state.cps, state.deckState],
  )
  useKeyboardShortcuts(shortcuts)

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault()
      patch({ installPromptEvent: event })
    }
    const onInstalled = () => {
      patch({ installPromptEvent: null })
      setMsg({ type: 'wait', text: 'SynthReel installed successfully.' })
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [patch, setMsg])

  const saveDraftTune = useCallback(() => {
    if (!state.draftTune.code.trim()) {
      setMsg({ type: 'err', text: 'Tune code cannot be empty.' })
      return
    }
    const id = `custom-${Date.now()}`
    const item = normalizeTrack({
      id,
      title: state.draftTune.title,
      description: state.draftTune.description,
      code: state.draftTune.code,
      custom: true,
      key: state.draftTune.key,
      bpm: state.draftTune.bpm,
      durationSec: state.draftTune.durationSec,
      moodTags: state.draftTune.moodTags.split(',').map((s) => s.trim()).filter(Boolean),
      color: '#1d274a',
      accent: '#7ab2ff',
      emoji: '🧪',
    })
    setCustomTunes((prev) => [...prev, item])
    setMsg({ type: 'wait', text: `Saved custom tune: ${item.title}` })
  }, [setCustomTunes, setMsg, state.draftTune])

  const playDraftTune = useCallback(async () => {
    const track = normalizeTrack({
      id: '__draft__',
      title: state.draftTune.title || 'Draft Tune',
      description: state.draftTune.description || 'Unsaved draft',
      key: state.draftTune.key,
      bpm: state.draftTune.bpm,
      durationSec: state.draftTune.durationSec,
      moodTags: state.draftTune.moodTags.split(',').map((s) => s.trim()).filter(Boolean),
      code: state.draftTune.code,
      custom: true,
      color: '#1f2f35',
      accent: '#4ad9bd',
      emoji: '📝',
    })
    await handleLoadAndPlay(track)
  }, [handleLoadAndPlay, state.draftTune])

  const handleInstall = useCallback(async () => {
    if (!state.installPromptEvent) return
    try {
      await state.installPromptEvent.prompt()
      await state.installPromptEvent.userChoice
    } catch {
      // noop
    } finally {
      patch({ installPromptEvent: null })
    }
  }, [patch, state.installPromptEvent])

  const handleRadioToggle = useCallback(() => {
    const idx = Math.max(0, state.loadedTrack ? tracks.findIndex((t) => t.id === state.loadedTrack.id) : 0)
    radio.toggle(idx)
  }, [radio, state.loadedTrack, tracks])

  const engineState = initializing ? 'wait' : error ? 'err' : ready ? 'ok' : 'wait'
  const engineLabel = initializing ? 'LOADING…' : error ? 'ENGINE ERROR' : ready ? 'ENGINE READY' : 'OFFLINE'

  return {
    ready,
    audioReady,
    analyser: getAnalyser(),
    state,
    radio,
    engineState,
    engineLabel,
    actions: {
      setRjVolume: (v) => setField('rjVolume', v),
      setVisualMode: (v) => setField('visualMode', v),
      toggleLooping: () => setField('looping', (l) => !l),
      play: handlePlay,
      pause: handlePause,
      stop: handleStop,
      setCps: handleCps,
      setMasterVolume: handleMasterVolume,
      exportWav: handleExport,
      radioLoad: handleRadioLoad,
      radioToggle: handleRadioToggle,
      setShowEditor: (v) => setField('showEditor', v),
      setShowShortcuts: (v) => setField('showShortcuts', v),
      install: handleInstall,
      setDraftTune: (v) => setField('draftTune', v),
      saveDraftTune,
      playDraftTune,
      setEq: setEqState,
      toggleTheme: () => {
        setTheme((v) => {
          const r = v === 'system' ? resolveTheme() : v
          return r === 'dark' ? 'light' : 'dark'
        })
      },
      queuePlayNow: (idx) => onQueuePlayNow(idx, handleLoadAndPlay),
    },
  }
}
