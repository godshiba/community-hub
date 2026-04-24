import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormRow } from './FormRow'

describe('FormRow', () => {
  it('renders label and children', () => {
    render(
      <FormRow label="Name">
        <input />
      </FormRow>
    )
    expect(screen.getByText('Name')).toBeInTheDocument()
  })

  it('renders hint text', () => {
    render(
      <FormRow label="Name" hint="Helper">
        <input />
      </FormRow>
    )
    expect(screen.getByText('Helper')).toBeInTheDocument()
  })

  it('shows error replacing hint', () => {
    render(
      <FormRow label="Name" hint="Helper" error="Bad">
        <input />
      </FormRow>
    )
    expect(screen.getByText('Bad')).toBeInTheDocument()
    expect(screen.queryByText('Helper')).not.toBeInTheDocument()
  })
})
