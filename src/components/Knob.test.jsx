import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Knob from './Knob'

describe('Knob', () => {
  it('calls onChange during drag interaction', () => {
    const onChange = vi.fn()
    const { container } = render(<Knob value={0.5} min={0} max={1} onChange={onChange} />)
    const knob = container.querySelector('.knob-wrap')
    expect(knob).toBeTruthy()

    fireEvent.mouseDown(knob, { clientY: 200 })
    fireEvent.mouseMove(window, { clientY: 100 })
    fireEvent.mouseUp(window)

    expect(onChange).toHaveBeenCalled()
  })

  it('supports keyboard controls', () => {
    const onChange = vi.fn()
    const { container } = render(<Knob value={0.5} min={0} max={1} onChange={onChange} />)
    const knob = container.querySelector('.knob-wrap')
    fireEvent.keyDown(knob, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalled()
  })
})
