import { Progress } from 'radix-ui'
import type { CSSProperties } from 'react'
import { cn } from '@renderer/lib/utils'

export type ProgressBarSize = 'sm' | 'md' | 'lg'

export interface ProgressBarProps {
  value?: number | null
  max?: number
  size?: ProgressBarSize
  tone?: 'accent' | 'success' | 'warning' | 'error'
  ariaLabel?: string
  className?: string
  style?: CSSProperties
}

const HEIGHT: Record<ProgressBarSize, number> = {
  sm: 3,
  md: 6,
  lg: 10
}

const TONE_COLOR: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  accent: 'var(--color-accent)',
  success: 'var(--color-success, #34c759)',
  warning: 'var(--color-warning, #ff9500)',
  error: 'var(--color-error)'
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  tone = 'accent',
  ariaLabel,
  className,
  style
}: ProgressBarProps): React.ReactElement {
  const indeterminate = value === null || value === undefined
  const clamped = indeterminate ? 0 : Math.max(0, Math.min(value, max))
  const pct = indeterminate ? 0 : (clamped / max) * 100
  const height = HEIGHT[size]
  const fill = TONE_COLOR[tone]

  return (
    <Progress.Root
      value={indeterminate ? null : clamped}
      max={max}
      aria-label={ariaLabel}
      className={cn('ui-native-progress', className)}
      style={{
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
        background: 'var(--color-surface-input)',
        borderRadius: height / 2,
        ...style
      }}
    >
      <Progress.Indicator
        style={{
          position: 'absolute',
          insetBlock: 0,
          left: 0,
          width: indeterminate ? '40%' : `${pct}%`,
          background: fill,
          borderRadius: 'inherit',
          transition: indeterminate
            ? undefined
            : 'width var(--duration-standard) var(--ease-standard)',
          animation: indeterminate
            ? 'ui-native-progress-indeterminate 1.4s linear infinite'
            : undefined
        }}
      />
    </Progress.Root>
  )
}
