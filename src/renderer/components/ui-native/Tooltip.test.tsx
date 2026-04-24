import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tooltip, TooltipProvider } from './Tooltip'

describe('Tooltip', () => {
  it('renders the trigger element', () => {
    render(
      <TooltipProvider>
        <Tooltip label="Hello">
          <button>Target</button>
        </Tooltip>
      </TooltipProvider>
    )
    expect(screen.getByRole('button', { name: 'Target' })).toBeInTheDocument()
  })
})
