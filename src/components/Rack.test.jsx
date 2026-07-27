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
    fireEvent.click(screen.getByRole('button', { name: /favorites only/i }))
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

  it('explains the empty favorites state instead of rendering a blank grid', () => {
    render(
      <Rack
        tracks={tracks}
        loadedId={null}
        playing={false}
        onLoad={vi.fn()}
        radioEnabled={false}
        favorites={[]}
        onFavorite={vi.fn()}
        onQueue={vi.fn()}
        onlyFavorites
        onToggleFavorites={vi.fn()}
      />,
    )

    expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument()
  })

  it('explains why the rack is inert during radio mode', () => {
    render(
      <Rack
        tracks={tracks}
        loadedId={null}
        playing={false}
        onLoad={vi.fn()}
        radioEnabled
        favorites={[]}
        onFavorite={vi.fn()}
        onQueue={vi.fn()}
        onlyFavorites={false}
        onToggleFavorites={vi.fn()}
      />,
    )

    expect(screen.getByText(/radio mode is picking tapes/i)).toBeInTheDocument()
  })
})

