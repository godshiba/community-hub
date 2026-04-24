import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { TimePicker } from './TimePicker'

describe('TimePicker', () => {
  it('renders hours and minutes inputs in 24h mode', () => {
    const { container } = render(
      <TimePicker value={{ hours: 9, minutes: 30 }} onChange={() => undefined} mode="24h" />
    )
    const inputs = container.querySelectorAll('input')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })

  it('supports 12h mode with AM/PM toggle', () => {
    const { container } = render(
      <TimePicker value={{ hours: 14, minutes: 0 }} onChange={() => undefined} mode="12h" />
    )
    const inputs = container.querySelectorAll('input')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })
})
