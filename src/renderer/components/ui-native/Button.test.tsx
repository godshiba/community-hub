import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('fires onClick when not disabled', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Go</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Go
      </Button>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders a spinner when isLoading', () => {
    render(<Button isLoading>Loading</Button>)
    const button = screen.getByRole('button', { name: 'Loading' })
    expect(button).toBeDisabled()
  })

  it('applies variant + size data attributes', () => {
    render(
      <Button variant="destructive" size="lg">
        Delete
      </Button>
    )
    const button = screen.getByRole('button', { name: 'Delete' })
    expect(button.className).toContain('ui-native-button--destructive')
  })

  it('renders as icon variant', () => {
    render(
      <Button variant="icon" aria-label="Add">
        +
      </Button>
    )
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })
})
