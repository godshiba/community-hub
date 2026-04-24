import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KeyCap } from './KeyCap'

describe('KeyCap', () => {
  it('renders cmd symbol', () => {
    render(<KeyCap keys={['cmd', 'K']} />)
    expect(screen.getByText('⌘')).toBeInTheDocument()
    expect(screen.getByText('K')).toBeInTheDocument()
  })

  it('renders enter and shift symbols', () => {
    render(<KeyCap keys={['shift', 'enter']} />)
    expect(screen.getByText('⇧')).toBeInTheDocument()
    expect(screen.getByText('↩')).toBeInTheDocument()
  })

  it('sets aria-label from keys', () => {
    const { container } = render(<KeyCap keys={['cmd', 'K']} />)
    expect((container.firstChild as HTMLElement).getAttribute('aria-label')).toBe('cmd K')
  })
})
