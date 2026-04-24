import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiscordIcon } from './DiscordIcon'
import { TelegramIcon } from './TelegramIcon'
import { IconMap } from './icon-map'

describe('Brand icons', () => {
  it('DiscordIcon renders with default aria-label', () => {
    render(<DiscordIcon />)
    expect(screen.getByRole('img', { name: 'Discord' })).toBeInTheDocument()
  })

  it('TelegramIcon renders with default aria-label', () => {
    render(<TelegramIcon />)
    expect(screen.getByRole('img', { name: 'Telegram' })).toBeInTheDocument()
  })

  it('Honors custom size', () => {
    const { container } = render(<DiscordIcon size={32} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('32')
  })
})

describe('IconMap', () => {
  it('has an entry for each Lucide icon used in the project', () => {
    const requiredKeys = [
      'Activity',
      'AlertCircle',
      'ArrowLeft',
      'BarChart3',
      'Check',
      'ChevronLeft',
      'ChevronRight',
      'Search',
      'Settings',
      'Users'
    ]
    for (const key of requiredKeys) {
      expect(IconMap).toHaveProperty(key)
    }
  })
})
