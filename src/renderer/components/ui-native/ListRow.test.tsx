import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListRow } from './ListRow'

describe('ListRow', () => {
  it('renders title and subtitle', () => {
    render(<ListRow title="Alice" subtitle="alice@example.com" />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })

  it('fires onSelect on click', async () => {
    const onSelect = vi.fn()
    render(<ListRow title="Row" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /Row/ }))
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('does not fire onSelect when disabled', async () => {
    const onSelect = vi.fn()
    render(<ListRow title="Row" onSelect={onSelect} disabled />)
    await userEvent.click(screen.getByText('Row'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('fires onSelect on Enter keydown', async () => {
    const onSelect = vi.fn()
    render(<ListRow title="Row" onSelect={onSelect} />)
    const row = screen.getByRole('button')
    row.focus()
    await userEvent.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledOnce()
  })
})
