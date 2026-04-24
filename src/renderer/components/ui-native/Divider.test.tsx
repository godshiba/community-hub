import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Divider } from './Divider'

describe('Divider', () => {
  it('renders horizontally by default', () => {
    const { container } = render(<Divider />)
    const el = container.firstChild as HTMLElement
    expect(el.style.height).toBe('1px')
  })

  it('supports vertical orientation', () => {
    const { container } = render(<Divider orientation="vertical" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.width).toBe('1px')
  })

  it('accepts strong weight', () => {
    const { container } = render(<Divider weight="strong" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.background).toContain('divider-strong')
  })
})
