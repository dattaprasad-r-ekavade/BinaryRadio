// @ts-nocheck — test DOM queries; typed migration tracked in issue #TS-001
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import QueuePanel from './QueuePanel'

const queueTracks = [
  { id: 'a', title: 'Alpha' },
  { id: 'b', title: 'Beta' },
]

describe('QueuePanel', () => {
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

    const playButtons = screen.getAllByRole('button', { name: /play/i })
    fireEvent.click(playButtons[0])
    expect(onPlayNow).toHaveBeenCalledWith(0)

    const rows = screen.getAllByText(/^\d+\.\s/i).map((el) => el.closest('.queue-row'))
    const firstRowButtons = rows[0].querySelectorAll('button')
    const secondRowButtons = rows[1].querySelectorAll('button')

    // buttons order: up, down, play, remove
    fireEvent.click(firstRowButtons[3])
    expect(onRemove).toHaveBeenCalledWith(0)

    fireEvent.click(secondRowButtons[0])
    expect(onMove).toHaveBeenCalledWith(1, 0)
  })
})
