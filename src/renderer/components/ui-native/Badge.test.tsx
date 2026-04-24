import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders count', () => {
    render(<Badge count={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders double-digit count', () => {
    render(<Badge count={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('caps at 99+ when over max', () => {
    render(<Badge count={150} />)
    expect(screen.getByText(/99\+|150/)).toBeInTheDocument()
  })
})
