import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContextMenu } from './ContextMenu'

describe('ContextMenu', () => {
  it('renders the trigger', () => {
    render(
      <ContextMenu
        trigger={<div>target</div>}
        items={[{ id: 'a', label: 'A', onSelect: () => undefined }]}
      />
    )
    expect(screen.getByText('target')).toBeInTheDocument()
  })
})
