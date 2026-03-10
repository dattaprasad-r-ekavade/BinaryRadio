import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CassetteCard from './CassetteCard'

const track = {
  id: 't1',
  title: 'Test Tape',
  description: 'Tape description',
  color: '#111',
  accent: '#222',
  emoji: '🎵',
  bpm: 100,
  key: 'Am',
}

describe('CassetteCard', () => {
  afterEach(() => cleanup())

  it('renders metadata and triggers load on click', () => {
    const onClick = vi.fn()
    render(
      <CassetteCard
        track={track}
        loaded={false}
        playing={false}
        favorite={false}
        onClick={onClick}
        onFavorite={vi.fn()}
        onQueue={vi.fn()}
      />,
    )

    expect(screen.getByText('Test Tape')).toBeInTheDocument()
    expect(screen.getByText('Tape description')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /test tape tape/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('triggers load with keyboard enter', () => {
    const onClick = vi.fn()
    render(
      <CassetteCard
        track={track}
        loaded={false}
        playing={false}
        favorite={false}
        onClick={onClick}
        onFavorite={vi.fn()}
        onQueue={vi.fn()}
      />,
    )
    const card = screen.getByLabelText('Test Tape tape')
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
