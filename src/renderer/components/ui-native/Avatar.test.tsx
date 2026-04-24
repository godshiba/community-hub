import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('renders initials from two-word name', () => {
    render(<Avatar name="Alice Liddell" />)
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('renders two-letter initial from one-word name', () => {
    render(<Avatar name="Alice" />)
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('applies custom size', () => {
    const { container } = render(<Avatar name="X" size={48} />)
    const el = container.firstChild as HTMLElement
    expect(el.style.width).toBe('48px')
  })
})
