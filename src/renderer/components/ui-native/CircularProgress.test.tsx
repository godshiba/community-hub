import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CircularProgress } from './CircularProgress'

describe('CircularProgress', () => {
  it('renders progressbar role', () => {
    render(<CircularProgress value={25} ariaLabel="loading" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('sets aria-busy in indeterminate mode', () => {
    render(<CircularProgress ariaLabel="loading" />)
    const pb = screen.getByRole('progressbar')
    expect(pb.getAttribute('aria-busy')).toBe('true')
  })

  it('reflects value', () => {
    render(<CircularProgress value={67} ariaLabel="p" />)
    const pb = screen.getByRole('progressbar')
    expect(pb.getAttribute('aria-valuenow')).toBe('67')
  })
})
