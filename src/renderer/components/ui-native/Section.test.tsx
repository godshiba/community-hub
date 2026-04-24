import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Section } from './Section'

describe('Section', () => {
  it('renders title and children', () => {
    render(
      <Section title="Title">
        <div>body</div>
      </Section>
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(
      <Section title="T" subtitle="Sub">
        x
      </Section>
    )
    expect(screen.getByText('Sub')).toBeInTheDocument()
  })
})
