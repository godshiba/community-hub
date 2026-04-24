import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Disclosure } from './Disclosure'

describe('Disclosure', () => {
  it('renders title', () => {
    render(
      <Disclosure title="Advanced">
        <div>hidden body</div>
      </Disclosure>
    )
    expect(screen.getByText('Advanced')).toBeInTheDocument()
  })

  it('reveals content on trigger click', async () => {
    render(
      <Disclosure title="Open me">
        <div>secret</div>
      </Disclosure>
    )
    await userEvent.click(screen.getByRole('button', { name: /Open me/ }))
    expect(await screen.findByText('secret')).toBeInTheDocument()
  })

  it('renders default-open content immediately', () => {
    render(
      <Disclosure title="A" defaultOpen>
        <div>visible</div>
      </Disclosure>
    )
    expect(screen.getByText('visible')).toBeInTheDocument()
  })
})
