import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DropdownMenu } from './DropdownMenu'

describe('DropdownMenu', () => {
  it('renders the trigger', () => {
    render(
      <DropdownMenu
        trigger={<button>Open</button>}
        items={[{ id: 'a', label: 'A', onSelect: () => undefined }]}
      />
    )
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
  })

  it('opens and calls onSelect when an item is clicked', async () => {
    const onSelect = vi.fn()
    render(
      <DropdownMenu
        trigger={<button>Open</button>}
        items={[{ id: 'a', label: 'Action', onSelect }]}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    const item = await screen.findByText('Action')
    await userEvent.click(item)
    expect(onSelect).toHaveBeenCalledOnce()
  })
})
