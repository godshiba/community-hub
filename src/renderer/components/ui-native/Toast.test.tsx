import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Toast, ToastProvider, ToastViewport } from './Toast'

describe('Toast', () => {
  it('renders title and description when open', () => {
    render(
      <ToastProvider>
        <Toast open onOpenChange={() => undefined} title="Saved" description="Changes live" />
        <ToastViewport />
      </ToastProvider>
    )
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('Changes live')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <ToastProvider>
        <Toast open={false} onOpenChange={() => undefined} title="Saved" />
        <ToastViewport />
      </ToastProvider>
    )
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })
})
