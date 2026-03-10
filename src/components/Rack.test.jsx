import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Rack from './Rack'

const tracks = [
  {
    id: 'a',
    title: 'Alpha',
    description: 'desc',
    color: '#111',
    accent: '#222',
    emoji: '🎵',
    bpm: 90,
    key: 'Am',
  },
  {
    id: 'b',
    title: 'Beta',
    description: 'desc',
    color: '#111',
    accent: '#222',
    emoji: '🎵',
    bpm: 90,
    key: 'Am',
  },
]

describe('Rack', () => {
  it('renders all tracks and toggles favorites filter', () => {
    const onToggleFavorites = vi.fn()
    const { rerender } = render(
      <Rack
        tracks={tracks}
        loadedId={null}
        playing={false}
        onLoad={vi.fn()}
        radioEnabled={false}
        favorites={['a']}
        onFavorite={vi.fn()}
        onQueue={vi.fn()}
        onlyFavorites={false}
        onToggleFavorites={onToggleFavorites}
      />,
    )

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /favorites/i }))
    expect(onToggleFavorites).toHaveBeenCalledTimes(1)

    rerender(
      <Rack
        tracks={tracks}
        loadedId={null}
        playing={false}
        onLoad={vi.fn()}
        radioEnabled={false}
        favorites={['a']}
        onFavorite={vi.fn()}
        onQueue={vi.fn()}
        onlyFavorites
        onToggleFavorites={onToggleFavorites}
      />,
    )
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Beta')).not.toBeInTheDocument()
  })
})

