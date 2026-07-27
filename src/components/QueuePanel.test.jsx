// @ts-nocheck — test DOM queries; typed migration tracked in issue #TS-001
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import QueuePanel from './QueuePanel'

const queueTracks = [
  { id: 'a', title: 'Alpha' },
  { id: 'b', title: 'Beta' },
]

describe('QueuePanel', () => {
  afterEach(() => cleanup())

  it('supports reorder, remove and clear operations', () => {
    const onRemove = vi.fn()
    const onMove = vi.fn()
    const onClear = vi.fn()
    const onPlayNow = vi.fn()

    render(
      <QueuePanel
        queueTracks={queueTracks}
        onRemove={onRemove}
        onMove={onMove}
        onClear={onClear}
        onPlayNow={onPlayNow}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(onClear).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getAllByRole('button', { name: /^play$/i })[0])
    expect(onPlayNow).toHaveBeenCalledWith(0)

    fireEvent.click(screen.getByRole('button', { name: /remove alpha from queue/i }))
    expect(onRemove).toHaveBeenCalledWith(0)

    fireEvent.click(screen.getByRole('button', { name: /move beta up/i }))
    expect(onMove).toHaveBeenCalledWith(1, 0)
  })

  it('disables the boundary reorder controls', () => {
    render(
      <QueuePanel
        queueTracks={queueTracks}
        onRemove={vi.fn()}
        onMove={vi.fn()}
        onClear={vi.fn()}
        onPlayNow={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /move alpha up/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /move beta down/i })).toBeDisabled()
  })

  it('shows guidance and disables Clear when the queue is empty', () => {
    render(
      <QueuePanel
        queueTracks={[]}
        onRemove={vi.fn()}
        onMove={vi.fn()}
        onClear={vi.fn()}
        onPlayNow={vi.fn()}
      />,
    )

    expect(screen.getByText(/nothing queued/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear/i })).toBeDisabled()
  })
})
