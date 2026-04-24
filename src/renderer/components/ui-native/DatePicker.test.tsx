import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DatePicker } from './DatePicker'

describe('DatePicker', () => {
  it('renders placeholder when no value', () => {
    render(<DatePicker value={null} onChange={() => undefined} placeholder="Choose" />)
    expect(screen.getByText('Choose')).toBeInTheDocument()
  })

  it('renders formatted date when value set', () => {
    const date = new Date(2026, 3, 15)
    render(<DatePicker value={date} onChange={() => undefined} locale="en-US" />)
    const text = screen.getByRole('button').textContent
    expect(text).toMatch(/Apr/)
  })
})
