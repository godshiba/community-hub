import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'

export type EmptyStateVariant = 'default' | 'error'
export type EmptyStateSize = 'sm' | 'md' | 'lg'

export interface EmptyStateProps {
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  secondaryAction?: ReactNode
  variant?: EmptyStateVariant
  size?: EmptyStateSize
  className?: string
  style?: CSSProperties
}

const SIZE: Record<EmptyStateSize, { iconSize: number; title: number; gap: number }> = {
  sm: { iconSize: 28, title: 14, gap: 8 },
  md: { iconSize: 40, title: 16, gap: 10 },
  lg: { iconSize: 56, title: 18, gap: 12 }
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  secondaryAction,
  variant = 'default',
  size = 'md',
  className,
  style
}: EmptyStateProps): React.ReactElement {
  const sz = SIZE[size]
  const iconColor =
    variant === 'error' ? 'var(--color-error)' : 'var(--color-fg-tertiary)'

  const container: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sz.gap,
    padding: 24,
    textAlign: 'center',
    color: 'var(--color-fg-secondary)',
    fontFamily: 'var(--font-sans)',
    ...style
  }

  return (
    <div
      role="status"
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn('ui-native-empty-state', className)}
      style={container}
    >
      {icon && (
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: sz.iconSize,
            height: sz.iconSize,
            color: iconColor
          }}
        >
          {icon}
        </span>
      )}
      <div
        style={{
          fontSize: sz.title,
          fontWeight: 600,
          lineHeight: 1.3,
          color: 'var(--color-fg-primary)',
          maxWidth: 360
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.45,
            color: 'var(--color-fg-tertiary)',
            maxWidth: 360
          }}
        >
          {subtitle}
        </div>
      )}
      {(action || secondaryAction) && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 4
          }}
        >
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}
