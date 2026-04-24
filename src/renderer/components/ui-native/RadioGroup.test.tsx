import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Radio, RadioGroup } from './RadioGroup'

describe('RadioGroup', () => {
  it('renders its radios', () => {
    render(
      <RadioGroup value="a" onChange={() => undefined}>
        <Radio value="a" label="A" />
        <Radio value="b" label="B" />
      </RadioGroup>
    )
    expect(screen.getAllByRole('radio').length).toBe(2)
  })

  it('fires onChange when a radio is selected', async () => {
    const onChange = vi.fn()
    render(
      <RadioGroup value="a" onChange={onChange}>
        <Radio value="a" label="A" />
        <Radio value="b" label="B" />
      </RadioGroup>
    )
    await userEvent.click(screen.getAllByRole('radio')[1])
    expect(onChange).toHaveBeenCalledWith('b')
  })
})
