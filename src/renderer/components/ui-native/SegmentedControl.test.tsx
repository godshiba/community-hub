import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SegmentedControl } from './SegmentedControl'

const OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' }
] as const

describe('SegmentedControl', () => {
  it('renders each option as a button', () => {
    render(<SegmentedControl value="day" onChange={() => undefined} options={OPTIONS} />)
    expect(screen.getAllByRole('tab').length).toBe(3)
  })

  it('fires onChange when a segment is clicked', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl value="day" onChange={onChange} options={OPTIONS} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Week' }))
    expect(onChange).toHaveBeenCalledWith('week')
  })

  it('marks active segment with aria-selected', () => {
    render(<SegmentedControl value="week" onChange={() => undefined} options={OPTIONS} />)
    const active = screen.getByRole('tab', { name: 'Week' })
    expect(active.getAttribute('aria-selected')).toBe('true')
  })
})
