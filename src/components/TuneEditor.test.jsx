import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TuneEditor from './TuneEditor'

const draft = {
  title: 'My Tune',
  description: 'desc',
  key: 'Am',
  bpm: 96,
  durationSec: 180,
  moodTags: 'custom,ambient',
  code: 'setcps(0.25)',
}

describe('TuneEditor', () => {
  it('does not render when closed', () => {
    const { container } = render(
      <TuneEditor
        open={false}
        draft={draft}
        onDraft={vi.fn()}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onPlay={vi.fn()}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('updates draft fields and triggers save/play callbacks', () => {
    const onDraft = vi.fn()
    const onSave = vi.fn()
    const onPlay = vi.fn()

    render(
      <TuneEditor
        open
        draft={draft}
        onDraft={onDraft}
        onClose={vi.fn()}
        onSave={onSave}
        onPlay={onPlay}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText(/title/i), { target: { value: 'New Title' } })
    expect(onDraft).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /play draft/i }))
    fireEvent.click(screen.getByRole('button', { name: /add to rack/i }))
    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})

