import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TextArea } from './TextArea'

describe('TextArea', () => {
  it('renders textarea', () => {
    render(<TextArea value="" onChange={() => undefined} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('fires onChange', async () => {
    const onChange = vi.fn()
    render(<TextArea value="" onChange={onChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'hi')
    expect(onChange).toHaveBeenCalled()
  })
})
