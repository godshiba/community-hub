import { forwardRef, type HTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'

export type PillVariant =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'discord'
  | 'telegram'

export type PillSize = 'sm' | 'md'

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: PillVariant
  size?: PillSize
  leading?: ReactNode
  trailing?: ReactNode
}

interface ToneStyle {
  background: string
  color: string
}

const TONE: Record<PillVariant, ToneStyle> = {
  neutral: {
    background: 'var(--color-surface-card-raised)',
    color: 'var(--color-fg-secondary)'
  },
  accent: {
    background: 'var(--color-accent-fill)',
    color: 'var(--color-accent)'
  },
  success: {
    background: 'color-mix(in oklch, var(--color-success) 18%, transparent)',
    color: 'var(--color-success)'
  },
  warning: {
    background: 'color-mix(in oklch, var(--color-warning) 18%, transparent)',
    color: 'var(--color-warning)'
  },
  error: {
    background: 'color-mix(in oklch, var(--color-error) 18%, transparent)',
    color: 'var(--color-error)'
  },
  discord: {
    background: 'color-mix(in oklch, var(--color-discord) 22%, transparent)',
    color: 'var(--color-discord)'
  },
  telegram: {
    background: 'color-mix(in oklch, var(--color-telegram) 22%, transparent)',
    color: 'var(--color-telegram)'
  }
}

const SIZE: Record<PillSize, CSSProperties> = {
  sm: { fontSize: 11, paddingBlock: 2, paddingInline: 6, gap: 4, lineHeight: 1.4 },
  md: { fontSize: 12, paddingBlock: 3, paddingInline: 8, gap: 6, lineHeight: 1.4 }
}

export const Pill = forwardRef<HTMLSpanElement, PillProps>(function Pill(
  { variant = 'neutral', size = 'md', leading, trailing, className, style, children, ...rest },
  ref
) {
  const tone = TONE[variant]
  const merged: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 'var(--radius-full)',
    fontWeight: 500,
    letterSpacing: 0.2,
    whiteSpace: 'nowrap',
    ...SIZE[size],
    background: tone.background,
    color: tone.color,
    ...style
  }

  return (
    <span ref={ref} className={cn(className)} style={merged} {...rest}>
      {leading}
      {children}
      {trailing}
    </span>
  )
})
