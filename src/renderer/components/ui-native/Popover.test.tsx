import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Popover } from './Popover'

describe('Popover', () => {
  it('renders trigger', () => {
    render(
      <Popover trigger={<button>Open</button>}>
        <div>body</div>
      </Popover>
    )
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
  })

  it('opens content on trigger click', async () => {
    render(
      <Popover trigger={<button>Open</button>}>
        <div>body</div>
      </Popover>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(await screen.findByText('body')).toBeInTheDocument()
  })
})
