import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordField } from './PasswordField'

describe('PasswordField', () => {
  it('starts masked', () => {
    const { container } = render(<PasswordField value="x" onChange={() => undefined} />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.type).toBe('password')
  })

  it('toggles visibility on show button', async () => {
    const { container } = render(<PasswordField value="x" onChange={() => undefined} />)
    const toggle = screen.getByRole('button')
    await userEvent.click(toggle)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.type).toBe('text')
  })

  it('fires onChange', async () => {
    const onChange = vi.fn()
    const { container } = render(<PasswordField value="" onChange={onChange} />)
    const input = container.querySelector('input') as HTMLInputElement
    await userEvent.type(input, 'hi')
    expect(onChange).toHaveBeenCalled()
  })
})
