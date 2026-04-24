import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Pill } from './Pill'

describe('Pill', () => {
  it('renders children', () => {
    render(<Pill>online</Pill>)
    expect(screen.getByText('online')).toBeInTheDocument()
  })

  it.each(['neutral', 'accent', 'success', 'warning', 'error', 'discord', 'telegram'] as const)(
    'renders %s variant',
    (variant) => {
      render(<Pill variant={variant}>x</Pill>)
      expect(screen.getByText('x')).toBeInTheDocument()
    }
  )
})
