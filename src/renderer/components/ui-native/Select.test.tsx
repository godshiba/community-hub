import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Select } from './Select'

const OPTIONS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' }
] as const

describe('Select', () => {
  it('renders its trigger with placeholder when no value', () => {
    render(<Select value={null} onChange={() => undefined} options={OPTIONS} placeholder="Pick…" />)
    expect(screen.getByText('Pick…')).toBeInTheDocument()
  })

  it('renders selected label', () => {
    render(<Select value="a" onChange={() => undefined} options={OPTIONS} />)
    expect(screen.getByText('Apple')).toBeInTheDocument()
  })
})
