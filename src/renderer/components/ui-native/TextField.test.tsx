import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TextField } from './TextField'

describe('TextField', () => {
  it('renders a textbox', () => {
    render(<TextField value="" onChange={() => undefined} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('fires onChange on input', async () => {
    const onChange = vi.fn()
    render(<TextField value="" onChange={onChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'hi')
    expect(onChange).toHaveBeenCalled()
  })

  it('shows hint text', () => {
    render(<TextField value="" onChange={() => undefined} hint="Helper" />)
    expect(screen.getByText('Helper')).toBeInTheDocument()
  })

  it('shows error text and replaces hint', () => {
    render(
      <TextField value="" onChange={() => undefined} hint="Helper" error="Bad" />
    )
    expect(screen.getByText('Bad')).toBeInTheDocument()
    expect(screen.queryByText('Helper')).not.toBeInTheDocument()
  })

  it('disables input', () => {
    render(<TextField value="" onChange={() => undefined} disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
