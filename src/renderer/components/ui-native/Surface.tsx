import { forwardRef, type HTMLAttributes, type CSSProperties } from 'react'
import { cn } from '@renderer/lib/utils'

export type SurfaceVariant = 'plain' | 'raised' | 'input' | 'elevated'

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant
  radius?: 'sm' | 'md' | 'lg' | 'xl' | 'none'
  bordered?: boolean
}

const VARIANT_BACKGROUND: Record<SurfaceVariant, string> = {
  plain: 'var(--color-surface-card)',
  raised: 'var(--color-surface-card-raised)',
  input: 'var(--color-surface-input)',
  elevated: 'var(--color-surface-card-elevated)'
}

const RADIUS_TOKEN: Record<NonNullable<SurfaceProps['radius']>, string> = {
  none: '0',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)'
}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { variant = 'plain', radius = 'lg', bordered = false, className, style, children, ...rest },
  ref
) {
  const merged: CSSProperties = {
    background: VARIANT_BACKGROUND[variant],
    borderRadius: RADIUS_TOKEN[radius],
    boxShadow: variant === 'input'
      ? 'inset 0 1px 0 rgba(0,0,0,0.4)'
      : undefined,
    border: bordered ? '1px solid var(--color-divider)' : undefined,
    ...style
  }

  return (
    <div ref={ref} className={cn(className)} style={merged} {...rest}>
      {children}
    </div>
  )
})
