import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NumberField } from './NumberField'

describe('NumberField', () => {
  it('renders current value', () => {
    const { container } = render(<NumberField value={5} onChange={() => undefined} />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.value).toBe('5')
  })

  it('increments via up stepper button', async () => {
    const onChange = vi.fn()
    render(<NumberField value={5} onChange={onChange} min={0} max={10} />)
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[0])
    expect(onChange).toHaveBeenCalled()
  })
})
