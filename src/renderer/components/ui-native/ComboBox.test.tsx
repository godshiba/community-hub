import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComboBox } from './ComboBox'

const OPTIONS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' }
] as const

describe('ComboBox', () => {
  it('renders with placeholder', () => {
    render(
      <ComboBox value={null} onChange={() => undefined} options={OPTIONS} placeholder="Pick…" />
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})
