import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Slider } from './Slider'

describe('Slider', () => {
  it('renders a slider', () => {
    render(<Slider value={50} onChange={() => undefined} min={0} max={100} />)
    expect(screen.getAllByRole('slider').length).toBeGreaterThan(0)
  })

  it('exposes aria value', () => {
    render(<Slider value={25} onChange={() => undefined} min={0} max={100} />)
    const slider = screen.getAllByRole('slider')[0]
    expect(slider.getAttribute('aria-valuenow')).toBe('25')
  })
})
