import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { StatusDot } from './StatusDot'

describe('StatusDot', () => {
  it.each(['success', 'warning', 'error', 'neutral', 'accent'] as const)(
    'renders %s tone',
    (tone) => {
      const { container } = render(<StatusDot tone={tone} />)
      expect(container.firstChild).toBeInTheDocument()
    }
  )

  it('applies pulse animation when pulse is true', () => {
    const { container } = render(<StatusDot tone="success" pulse />)
    const el = container.firstChild as HTMLElement
    expect(el.style.animation).toContain('status-dot-pulse')
  })
})
