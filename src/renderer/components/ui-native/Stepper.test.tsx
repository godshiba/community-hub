import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Stepper } from './Stepper'

describe('Stepper', () => {
  it('fires onIncrement when up clicked', async () => {
    const onIncrement = vi.fn()
    const onDecrement = vi.fn()
    render(<Stepper onIncrement={onIncrement} onDecrement={onDecrement} />)
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[0])
    expect(onIncrement).toHaveBeenCalledOnce()
  })

  it('fires onDecrement when down clicked', async () => {
    const onIncrement = vi.fn()
    const onDecrement = vi.fn()
    render(<Stepper onIncrement={onIncrement} onDecrement={onDecrement} />)
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[1])
    expect(onDecrement).toHaveBeenCalledOnce()
  })

  it('disables up when canIncrement is false', async () => {
    const onIncrement = vi.fn()
    render(
      <Stepper
        onIncrement={onIncrement}
        onDecrement={() => undefined}
        canIncrement={false}
      />
    )
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[0])
    expect(onIncrement).not.toHaveBeenCalled()
  })
})
