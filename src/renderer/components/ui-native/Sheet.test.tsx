import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sheet } from './Sheet'

describe('Sheet', () => {
  it('does not render content when closed', () => {
    render(
      <Sheet open={false} onOpenChange={() => undefined} title="T">
        body
      </Sheet>
    )
    expect(screen.queryByText('body')).not.toBeInTheDocument()
  })

  it('renders title/description/body when open', () => {
    render(
      <Sheet open onOpenChange={() => undefined} title="Title" description="desc">
        body
      </Sheet>
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('desc')).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
  })

  it('calls onOpenChange on Escape by default', async () => {
    const onOpenChange = vi.fn()
    render(
      <Sheet open onOpenChange={onOpenChange} title="T">
        body
      </Sheet>
    )
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
