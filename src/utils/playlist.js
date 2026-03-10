export function enqueue(queue, trackId) {
  if (!trackId) return queue
  return [...queue, trackId]
}

export function dequeue(queue) {
  if (!queue.length) return { next: null, queue: [] }
  return { next: queue[0], queue: queue.slice(1) }
}

export function removeFromQueue(queue, index) {
  if (index < 0 || index >= queue.length) return queue
  return queue.filter((_, i) => i !== index)
}

export function moveQueueItem(queue, from, to) {
  if (from === to) return queue
  if (from < 0 || from >= queue.length) return queue
  if (to < 0 || to >= queue.length) return queue
  const next = [...queue]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function toggleFavorite(favorites, trackId) {
  if (!trackId) return favorites
  const set = new Set(favorites)
  if (set.has(trackId)) set.delete(trackId)
  else set.add(trackId)
  return [...set]
}
