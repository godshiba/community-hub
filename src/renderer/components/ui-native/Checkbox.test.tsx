import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('renders as a checkbox', () => {
    render(<Checkbox checked={false} onChange={() => undefined} />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('toggles on click', async () => {
    const onChange = vi.fn()
    render(<Checkbox checked={false} onChange={onChange} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('handles indeterminate state', () => {
    render(<Checkbox checked="indeterminate" onChange={() => undefined} />)
    const cb = screen.getByRole('checkbox')
    expect(cb.getAttribute('aria-checked')).toBe('mixed')
  })
})
