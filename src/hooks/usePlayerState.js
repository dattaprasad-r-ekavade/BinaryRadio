import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { tracks as staticTracks } from '../data/tracks'
import { useStrudel } from './useStrudel'
import { useRadioMode } from './useRadioMode'
import { useLocalStorage } from './useLocalStorage'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import { enqueue, dequeue, removeFromQueue, moveQueueItem, toggleFavorite } from '../utils/playlist'
import { isValidManifestTrack, normalizeTrack, preparePlaybackCode } from '../utils/tunePipeline'

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
  manifestTracks: staticTracks.map(normalizeTrack),
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
  showEditor: false,
  showShortcuts: false,
  onlyFavorites: false,
  exporting: false,
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

export function usePlayerState() {
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

  const [customTunes, setCustomTunes] = useLocalStorage('synthreel.customTunes.v1', [])
  const [favorites, setFavorites] = useLocalStorage('synthreel.favorites.v1', [])
  const [queue, setQueue] = useLocalStorage('synthreel.queue.v1', [])
  const [theme, setTheme] = useLocalStorage('synthreel.theme.v1', 'system')
  const [masterVolume, setMasterVolumeState] = useLocalStorage('synthreel.masterVolume.v1', 1)
  const [eq, setEqState] = useLocalStorage('synthreel.eq.v1', { bass: 0, mid: 0, treble: 0 })

  useEffect(() => {
    fetch('/tunes/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          const valid = data.filter(isValidManifestTrack)
          if (valid.length !== data.length) {
            console.warn(
              `[SynthReel] Ignored ${data.length - valid.length} invalid tune manifest entries.`,
            )
          }
          if (valid.length) patch({ manifestTracks: valid.map(normalizeTrack) })
        }
      })
      .catch(() => {})
  }, [patch])

  const customTracks = useMemo(
    () => customTunes.map((t, i) => normalizeTrack({ ...t, custom: true }, i)),
    [customTunes],
  )

  const tracks = useMemo(() => {
    const map = new Map()
    for (const t of [...state.manifestTracks, ...customTracks]) map.set(t.id, t)
    return [...map.values()]
  }, [state.manifestTracks, customTracks])

  const trackMap = useMemo(() => {
    const m = new Map()
    tracks.forEach((t) => m.set(t.id, t))
    return m
  }, [tracks])

  const queueTracks = useMemo(() => queue.map((id) => trackMap.get(id)).filter(Boolean), [queue, trackMap])

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

  const radio = useRadioMode({
    tracks,
    onLoadAndPlay: handleLoadAndPlay,
    onStop: handleStop,
    rjVolume: state.rjVolume,
  })

  const handleRadioLoad = useCallback(
    (track) => {
      if (radio.enabled) {
        const idx = Math.max(
          0,
          tracks.findIndex((t) => t.id === track.id),
        )
        radio.start(idx)
      } else {
        handleLoad(track)
      }
    },
    [radio, tracks, handleLoad],
  )

  useEffect(() => {
    if (state.deckState === 'playing') setCps(state.cps)
  }, [state.cps, state.deckState, setCps])

  const playNextFromQueue = useCallback(async () => {
    const item = dequeue(queue)
    if (!item.next) return false
    const nextTrack = trackMap.get(item.next)
    if (!nextTrack) {
      setQueue(item.queue)
      return false
    }
    setQueue(item.queue)
    await handleLoadAndPlay(nextTrack)
    return true
  }, [queue, setQueue, trackMap, handleLoadAndPlay])

  useEffect(() => {
    if (state.deckState !== 'playing' || radio.enabled || !queue.length) return undefined
    const ms = (state.loadedTrack?.durationSec || 180) * 1000
    const t = setTimeout(() => {
      if (!state.looping) playNextFromQueue()
    }, ms)
    return () => clearTimeout(t)
  }, [
    state.deckState,
    radio.enabled,
    queue.length,
    state.loadedTrack?.durationSec,
    state.looping,
    playNextFromQueue,
  ])

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
    [tracks, state.loadedTrack, handleLoadAndPlay],
  )

  const handleNextTrack = useCallback(async () => {
    const playedFromQueue = await playNextFromQueue()
    if (!playedFromQueue) playRelativeTrack(1)
  }, [playNextFromQueue, playRelativeTrack])

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
      t: () =>
        setTheme((v) => {
          const r = v === 'system' ? resolveTheme() : v
          return r === 'dark' ? 'light' : 'dark'
        }),
    }),
    [
      state.deckState,
      handlePause,
      handlePlay,
      handleStop,
      handleNextTrack,
      playRelativeTrack,
      handleCps,
      state.cps,
      resolveTheme,
      setField,
      setTheme,
    ],
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
      moodTags: state.draftTune.moodTags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      color: '#1d274a',
      accent: '#7ab2ff',
      emoji: '🧪',
    })
    setCustomTunes((prev) => [...prev, item])
    setMsg({ type: 'wait', text: `Saved custom tune: ${item.title}` })
  }, [state.draftTune, setCustomTunes, setMsg])

  const playDraftTune = useCallback(async () => {
    const track = normalizeTrack({
      id: '__draft__',
      title: state.draftTune.title || 'Draft Tune',
      description: state.draftTune.description || 'Unsaved draft',
      key: state.draftTune.key,
      bpm: state.draftTune.bpm,
      durationSec: state.draftTune.durationSec,
      moodTags: state.draftTune.moodTags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      code: state.draftTune.code,
      custom: true,
      color: '#1f2f35',
      accent: '#4ad9bd',
      emoji: '📝',
    })
    await handleLoadAndPlay(track)
  }, [state.draftTune, handleLoadAndPlay])

  const toggleTheme = useCallback(() => {
    setTheme((v) => {
      const r = v === 'system' ? resolveTheme() : v
      return r === 'dark' ? 'light' : 'dark'
    })
  }, [resolveTheme, setTheme])

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

  const handleToggleFavorite = useCallback(
    (trackId) => setFavorites((prev) => toggleFavorite(prev, trackId)),
    [setFavorites],
  )
  const handleQueueTrack = useCallback((trackId) => setQueue((prev) => enqueue(prev, trackId)), [setQueue])
  const removeQueueIndex = useCallback((idx) => setQueue((q) => removeFromQueue(q, idx)), [setQueue])
  const moveQueueIndex = useCallback((from, to) => setQueue((q) => moveQueueItem(q, from, to)), [setQueue])
  const clearQueue = useCallback(() => setQueue([]), [setQueue])
  const playQueueIndex = useCallback(
    (idx) => {
      const id = queue[idx]
      const t = trackMap.get(id)
      if (!t) return
      setQueue((q) => removeFromQueue(q, idx))
      handleLoadAndPlay(t)
    },
    [handleLoadAndPlay, queue, setQueue, trackMap],
  )

  const engineState = initializing ? 'wait' : error ? 'err' : ready ? 'ok' : 'wait'
  const engineLabel = initializing
    ? 'LOADING…'
    : error
      ? 'ENGINE ERROR'
      : ready
        ? 'ENGINE READY'
        : 'OFFLINE'

  return {
    transport: {
      ready,
      audioReady,
      loadedTrack: state.loadedTrack,
      deckState: state.deckState,
      looping: state.looping,
      cps: state.cps,
      loadedCode: state.loadedCode,
      loading: state.loading,
      msg: state.msg,
      rjVolume: state.rjVolume,
      visualMode: state.visualMode,
      exporting: state.exporting,
      radio,
      analyser: getAnalyser(),
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
      },
    },
    library: {
      tracks,
      favorites,
      onlyFavorites: state.onlyFavorites,
      actions: {
        toggleFavorite: handleToggleFavorite,
        queueTrack: handleQueueTrack,
        toggleOnlyFavorites: () => setField('onlyFavorites', (v) => !v),
      },
    },
    queue: {
      tracks: queueTracks,
      actions: {
        remove: removeQueueIndex,
        move: moveQueueIndex,
        clear: clearQueue,
        playNow: playQueueIndex,
      },
    },
    ui: {
      theme,
      engineState,
      engineLabel,
      showEditor: state.showEditor,
      showShortcuts: state.showShortcuts,
      installPromptEvent: state.installPromptEvent,
      draftTune: state.draftTune,
      masterVolume,
      eq,
      actions: {
        setEq: setEqState,
        setShowEditor: (v) => setField('showEditor', v),
        setShowShortcuts: (v) => setField('showShortcuts', v),
        toggleTheme,
        install: handleInstall,
        setDraftTune: (v) => setField('draftTune', v),
        saveDraftTune,
        playDraftTune,
      },
    },
  }
}

