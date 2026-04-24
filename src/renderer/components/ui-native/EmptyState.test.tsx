import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    render(<EmptyState title="Empty" subtitle="Nothing here" />)
    expect(screen.getByText('Empty')).toBeInTheDocument()
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('renders action slot', () => {
    render(<EmptyState title="x" action={<button>Go</button>} />)
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
  })

  it('uses assertive live region in error variant', () => {
    render(<EmptyState variant="error" title="Failed" />)
    const status = screen.getByRole('status')
    expect(status.getAttribute('aria-live')).toBe('assertive')
  })
})
