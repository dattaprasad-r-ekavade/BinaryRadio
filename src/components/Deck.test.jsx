import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Deck from './Deck'

const baseProps = {
  track: null,
  playing: false,
  paused: false,
  looping: false,
  cps: 0.25,
  ready: true,
  onPlay: vi.fn(),
  onPause: vi.fn(),
  onStop: vi.fn(),
  onLoop: vi.fn(),
  onCps: vi.fn(),
  rjVolume: 0.5,
  onRjVolume: vi.fn(),
  radioEnabled: false,
  radioPhase: 'music',
  radioTimeLeft: 0,
  onRadioToggle: vi.fn(),
  visualMode: 'spectrum',
  onVisualMode: vi.fn(),
  analyser: null,
  masterVolume: 1,
  onMasterVolume: vi.fn(),
  eq: { bass: 0, mid: 0, treble: 0 },
  onEq: vi.fn(),
  onExport: vi.fn(),
  exporting: false,
  audioReady: true,
}

describe('Deck', () => {
  it('reflects stopped state and disabled transport without track', () => {
    render(<Deck {...baseProps} />)
    expect(screen.getByText(/NO TAPE/i)).toBeInTheDocument()
    const stopBtn = screen.getByRole('button', { name: /stop/i })
    expect(stopBtn).toBeDisabled()
  })

  it('shows pause control while playing and calls pause handler', () => {
    render(
      <Deck
        {...baseProps}
        track={{ id: 't1', title: 'Test', description: 'desc', bpm: 100, key: 'Am', durationSec: 60, moodTags: ['x'], emoji: '🎵' }}
        playing
      />,
    )
    const pauseBtn = screen.getByRole('button', { name: /pause/i })
    fireEvent.click(pauseBtn)
    expect(baseProps.onPause).toHaveBeenCalled()
  })

  it('keeps RJ radio toggle enabled when engine is ready even if audio graph is not ready', () => {
    render(<Deck {...baseProps} audioReady={false} ready />)
    const radioButtons = screen.getAllByRole('button', { name: /rj radio/i })
    expect(radioButtons[radioButtons.length - 1]).toBeEnabled()
  })
})
