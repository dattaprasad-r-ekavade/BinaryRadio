import { useCallback, useEffect, useMemo, useState } from 'react'
import { tracks as staticTracks } from '../data/tracks'
import { useLocalStorage } from './useLocalStorage'
import { toggleFavorite } from '../utils/playlist'
import { isValidManifestTrack, normalizeTrack } from '../utils/tunePipeline'

export function useLibrary() {
  const [manifestTracks, setManifestTracks] = useState(staticTracks.map(normalizeTrack))
  const [customTunes, setCustomTunes] = useLocalStorage('synthreel.customTunes.v1', [])
  const [favorites, setFavorites] = useLocalStorage('synthreel.favorites.v1', [])
  const [onlyFavorites, setOnlyFavorites] = useState(false)

  useEffect(() => {
    fetch('/tunes/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!Array.isArray(data) || !data.length) return
        const valid = data.filter(isValidManifestTrack)
        if (valid.length !== data.length) {
          console.warn(`[SynthReel] Ignored ${data.length - valid.length} invalid tune manifest entries.`)
        }
        if (valid.length) setManifestTracks(valid.map(normalizeTrack))
      })
      .catch(() => {})
  }, [])

  const customTracks = useMemo(
    () => customTunes.map((t, i) => normalizeTrack({ ...t, custom: true }, i)),
    [customTunes],
  )

  const tracks = useMemo(() => {
    const map = new Map()
    for (const t of [...manifestTracks, ...customTracks]) map.set(t.id, t)
    return [...map.values()]
  }, [manifestTracks, customTracks])

  const trackMap = useMemo(() => {
    const m = new Map()
    tracks.forEach((t) => m.set(t.id, t))
    return m
  }, [tracks])

  const toggleFavoriteTrack = useCallback(
    (trackId) => setFavorites((prev) => toggleFavorite(prev, trackId)),
    [setFavorites],
  )

  return {
    tracks,
    trackMap,
    favorites,
    onlyFavorites,
    customTunes,
    setCustomTunes,
    actions: {
      toggleFavorite: toggleFavoriteTrack,
      toggleOnlyFavorites: () => setOnlyFavorites((v) => !v),
    },
  }
}
