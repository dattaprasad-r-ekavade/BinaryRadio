import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { dequeue, enqueue, moveQueueItem, removeFromQueue } from '../utils/playlist'

export function useQueue(trackMap) {
  const [queue, setQueue] = useLocalStorage('synthreel.queue.v1', [])

  const queueTracks = useMemo(() => queue.map((id) => trackMap.get(id)).filter(Boolean), [queue, trackMap])

  const enqueueTrack = useCallback((trackId) => setQueue((prev) => enqueue(prev, trackId)), [setQueue])
  const remove = useCallback((idx) => setQueue((q) => removeFromQueue(q, idx)), [setQueue])
  const move = useCallback((from, to) => setQueue((q) => moveQueueItem(q, from, to)), [setQueue])
  const clear = useCallback(() => setQueue([]), [setQueue])

  const playNextFromQueue = useCallback(
    async (onLoadAndPlay) => {
      const item = dequeue(queue)
      if (!item.next) return false
      const nextTrack = trackMap.get(item.next)
      if (!nextTrack) {
        setQueue(item.queue)
        return false
      }
      setQueue(item.queue)
      await onLoadAndPlay(nextTrack)
      return true
    },
    [queue, setQueue, trackMap],
  )

  const playNow = useCallback(
    (idx, onLoadAndPlay) => {
      const id = queue[idx]
      const t = trackMap.get(id)
      if (!t) return
      setQueue((q) => removeFromQueue(q, idx))
      onLoadAndPlay(t)
    },
    [queue, setQueue, trackMap],
  )

  return {
    ids: queue,
    tracks: queueTracks,
    actions: { enqueueTrack, remove, move, clear, playNow },
    playNextFromQueue,
  }
}
