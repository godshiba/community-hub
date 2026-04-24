import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Surface } from './Surface'

describe('Surface', () => {
  it('renders children', () => {
    const { getByText } = render(<Surface>hello</Surface>)
    expect(getByText('hello')).toBeInTheDocument()
  })

  it.each(['plain', 'raised', 'input', 'elevated'] as const)(
    'applies %s variant background',
    (variant) => {
      const { container } = render(<Surface variant={variant}>x</Surface>)
      const el = container.firstChild as HTMLElement
      expect(el.style.background).toBeTruthy()
    }
  )

  it('applies bordered prop', () => {
    const { container } = render(<Surface bordered>x</Surface>)
    const el = container.firstChild as HTMLElement
    expect(el.style.border).toContain('1px')
  })

  it('applies radius token', () => {
    const { container } = render(<Surface radius="xl">x</Surface>)
    const el = container.firstChild as HTMLElement
    expect(el.style.borderRadius).toBe('var(--radius-xl)')
  })
})
