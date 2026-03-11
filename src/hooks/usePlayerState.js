import { useLocalStorage } from './useLocalStorage'
import { useLibrary } from './useLibrary'
import { useQueue } from './useQueue'
import { useTransport } from './useTransport'

export function usePlayerState() {
  const libraryState = useLibrary()
  const queueState = useQueue(libraryState.trackMap)

  const [theme, setTheme] = useLocalStorage('synthreel.theme.v1', 'system')
  const [masterVolume, setMasterVolumeState] = useLocalStorage('synthreel.masterVolume.v1', 1)
  const [eq, setEqState] = useLocalStorage('synthreel.eq.v1', { bass: 0, mid: 0, treble: 0 })

  const transport = useTransport({
    tracks: libraryState.tracks,
    queueIds: queueState.ids,
    playNextFromQueue: queueState.playNextFromQueue,
    onQueuePlayNow: queueState.actions.playNow,
    masterVolume,
    setMasterVolumeState,
    eq,
    setEqState,
    theme,
    setTheme,
    setCustomTunes: libraryState.setCustomTunes,
  })

  return {
    transport: {
      ready: transport.ready,
      audioReady: transport.audioReady,
      loadedTrack: transport.state.loadedTrack,
      deckState: transport.state.deckState,
      looping: transport.state.looping,
      cps: transport.state.cps,
      loadedCode: transport.state.loadedCode,
      loading: transport.state.loading,
      msg: transport.state.msg,
      rjVolume: transport.state.rjVolume,
      visualMode: transport.state.visualMode,
      exporting: transport.state.exporting,
      radio: transport.radio,
      analyser: transport.analyser,
      actions: {
        setRjVolume: transport.actions.setRjVolume,
        setVisualMode: transport.actions.setVisualMode,
        toggleLooping: transport.actions.toggleLooping,
        play: transport.actions.play,
        pause: transport.actions.pause,
        stop: transport.actions.stop,
        setCps: transport.actions.setCps,
        setMasterVolume: transport.actions.setMasterVolume,
        exportWav: transport.actions.exportWav,
        radioLoad: transport.actions.radioLoad,
        radioToggle: transport.actions.radioToggle,
      },
    },
    library: {
      tracks: libraryState.tracks,
      favorites: libraryState.favorites,
      onlyFavorites: libraryState.onlyFavorites,
      actions: {
        toggleFavorite: libraryState.actions.toggleFavorite,
        queueTrack: queueState.actions.enqueueTrack,
        toggleOnlyFavorites: libraryState.actions.toggleOnlyFavorites,
      },
    },
    queue: {
      tracks: queueState.tracks,
      actions: {
        remove: queueState.actions.remove,
        move: queueState.actions.move,
        clear: queueState.actions.clear,
        playNow: (idx) => transport.actions.queuePlayNow(idx),
      },
    },
    ui: {
      theme,
      engineState: transport.engineState,
      engineLabel: transport.engineLabel,
      showEditor: transport.state.showEditor,
      showShortcuts: transport.state.showShortcuts,
      installPromptEvent: transport.state.installPromptEvent,
      draftTune: transport.state.draftTune,
      masterVolume,
      eq,
      actions: {
        setEq: transport.actions.setEq,
        setShowEditor: transport.actions.setShowEditor,
        setShowShortcuts: transport.actions.setShowShortcuts,
        toggleTheme: transport.actions.toggleTheme,
        install: transport.actions.install,
        setDraftTune: transport.actions.setDraftTune,
        saveDraftTune: transport.actions.saveDraftTune,
        playDraftTune: transport.actions.playDraftTune,
      },
    },
  }
}
