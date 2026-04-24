import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it.each(['line', 'circle', 'rect'] as const)('renders %s variant', (variant) => {
    const { container } = render(<Skeleton variant={variant} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('animates shimmer', () => {
    const { container } = render(<Skeleton variant="line" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.animation).toContain('skeleton-shimmer')
  })
})
