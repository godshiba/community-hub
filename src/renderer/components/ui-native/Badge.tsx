import { memo, type CSSProperties } from 'react'

export interface BadgeProps {
  count: number
  max?: number
  tone?: 'accent' | 'error' | 'neutral'
  dot?: boolean
  className?: string
  style?: CSSProperties
}

const TONE_BG: Record<NonNullable<BadgeProps['tone']>, string> = {
  accent: 'var(--color-accent)',
  error: 'var(--color-error)',
  neutral: 'var(--color-fg-tertiary)'
}

export const Badge = memo(function Badge({
  count,
  max = 99,
  tone = 'accent',
  dot = false,
  className,
  style
}: BadgeProps): React.ReactElement | null {
  if (count <= 0) return null

  const display = count > max ? `${max}+` : String(count)

  const merged: CSSProperties = dot
    ? {
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: TONE_BG[tone],
        ...style
      }
    : {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 18,
        height: 18,
        paddingInline: 5,
        borderRadius: 'var(--radius-full)',
        background: TONE_BG[tone],
        color: 'var(--color-accent-fg-on-fill)',
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: 0,
        fontVariantNumeric: 'tabular-nums',
        ...style
      }

  return (
    <span
      role="status"
      aria-label={`${count} unread`}
      className={className}
      style={merged}
    >
      {!dot && display}
    </span>
  )
})
