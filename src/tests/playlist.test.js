import { describe, it, expect } from 'vitest'
import { enqueue, dequeue, removeFromQueue, moveQueueItem, toggleFavorite } from '../utils/playlist'

describe('playlist utils', () => {
  it('enqueues and dequeues in order', () => {
    const q1 = enqueue([], 'a')
    const q2 = enqueue(q1, 'b')
    expect(q2).toEqual(['a', 'b'])
    expect(dequeue(q2)).toEqual({ next: 'a', queue: ['b'] })
  })

  it('removes and moves queue items safely', () => {
    const q = ['a', 'b', 'c']
    expect(removeFromQueue(q, 1)).toEqual(['a', 'c'])
    expect(moveQueueItem(q, 2, 0)).toEqual(['c', 'a', 'b'])
    expect(moveQueueItem(q, 3, 0)).toEqual(q)
  })

  it('toggles favorites', () => {
    const f1 = toggleFavorite([], 'x')
    expect(f1).toEqual(['x'])
    const f2 = toggleFavorite(f1, 'x')
    expect(f2).toEqual([])
  })
})
