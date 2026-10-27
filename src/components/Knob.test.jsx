// @ts-nocheck — test DOM queries; typed migration tracked in issue #TS-001
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

  it('turns up when the pointer circles clockwise', () => {
    const onChange = vi.fn()
    const { container } = render(<Knob value={0.5} min={0} max={1} onChange={onChange} />)
    const knob = container.querySelector('.knob-wrap')
    knob.getBoundingClientRect = () => ({ left: 0, top: 0, width: 80, height: 80, right: 80, bottom: 80 })

    // 12 o'clock to 3 o'clock around the centre (40, 40): a quarter turn, no net straight drag.
    fireEvent.mouseDown(knob, { clientX: 40, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 68, clientY: 12 })
    fireEvent.mouseMove(window, { clientX: 80, clientY: 40 })
    fireEvent.mouseUp(window)

    const last = onChange.mock.calls.at(-1)[0]
    expect(last).toBeGreaterThan(0.75)
  })

  it('turns up when dragged to the right', () => {
    const onChange = vi.fn()
    const { container } = render(<Knob value={0.5} min={0} max={1} onChange={onChange} />)
    const knob = container.querySelector('.knob-wrap')
    knob.getBoundingClientRect = () => ({ left: 0, top: 0, width: 80, height: 80, right: 80, bottom: 80 })

    // Pressed at the centre and dragged right: a straight drag, 80 px = half the range.
    fireEvent.mouseDown(knob, { clientX: 40, clientY: 40 })
    fireEvent.mouseMove(window, { clientX: 48, clientY: 40 })
    fireEvent.mouseMove(window, { clientX: 120, clientY: 40 })
    fireEvent.mouseUp(window)

    expect(onChange.mock.calls.at(-1)[0]).toBeCloseTo(1, 1)
  })

  it('supports keyboard controls', () => {
    const onChange = vi.fn()
    const { container } = render(<Knob value={0.5} min={0} max={1} onChange={onChange} />)
    const knob = container.querySelector('.knob-wrap')
    fireEvent.keyDown(knob, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalled()
  })
})
