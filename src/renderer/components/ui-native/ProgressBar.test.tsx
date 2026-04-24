import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('renders a progressbar role', () => {
    render(<ProgressBar value={30} ariaLabel="p" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('reflects value via aria-valuenow', () => {
    render(<ProgressBar value={42} ariaLabel="p" />)
    const pb = screen.getByRole('progressbar')
    expect(pb.getAttribute('aria-valuenow')).toBe('42')
  })

  it('omits aria-valuenow when indeterminate', () => {
    render(<ProgressBar value={null} ariaLabel="p" />)
    const pb = screen.getByRole('progressbar')
    expect(pb.getAttribute('aria-valuenow')).toBeNull()
  })
})
