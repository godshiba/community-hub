import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Alert } from './Alert'

describe('Alert', () => {
  it('renders title and description when open', () => {
    render(
      <Alert
        open
        onOpenChange={() => undefined}
        title="Delete?"
        description="This is permanent."
      />
    )
    expect(screen.getByText('Delete?')).toBeInTheDocument()
    expect(screen.getByText('This is permanent.')).toBeInTheDocument()
  })

  it('fires onConfirm on confirm button', async () => {
    const onConfirm = vi.fn()
    render(
      <Alert
        open
        onOpenChange={() => undefined}
        title="OK?"
        confirmLabel="OK"
        onConfirm={onConfirm}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('fires onCancel on cancel button', async () => {
    const onCancel = vi.fn()
    render(
      <Alert
        open
        onOpenChange={() => undefined}
        title="OK?"
        cancelLabel="No"
        onCancel={onCancel}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
