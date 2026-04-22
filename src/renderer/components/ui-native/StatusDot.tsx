import { memo, type CSSProperties } from 'react'

export type StatusTone =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'discord'
  | 'telegram'

export interface StatusDotProps {
  tone?: StatusTone
  size?: number
  pulse?: boolean
  label?: string
  className?: string
  style?: CSSProperties
}

const TONE_COLOR: Record<StatusTone, string> = {
  neutral: 'var(--color-fg-tertiary)',
  accent: 'var(--color-accent)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  discord: 'var(--color-discord)',
  telegram: 'var(--color-telegram)'
}

export const StatusDot = memo(function StatusDot({
  tone = 'neutral',
  size = 8,
  pulse = false,
  label,
  className,
  style
}: StatusDotProps): React.ReactElement {
  const color = TONE_COLOR[tone]
  const merged: CSSProperties = {
    display: 'inline-block',
    width: size,
    height: size,
    borderRadius: '50%',
    background: color,
    boxShadow: pulse ? `0 0 0 0 ${color}` : undefined,
    animation: pulse ? 'status-dot-pulse 1.6s ease-out infinite' : undefined,
    flexShrink: 0,
    ...style
  }

  return (
    <span
      role={label ? 'status' : undefined}
      aria-label={label}
      className={className}
      style={merged}
    />
  )
})
