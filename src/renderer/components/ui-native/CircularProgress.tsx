import type { CSSProperties } from 'react'
import { cn } from '@renderer/lib/utils'

export type CircularProgressSize = 'xs' | 'sm' | 'md' | 'lg'

export interface CircularProgressProps {
  value?: number | null
  size?: CircularProgressSize
  strokeWidth?: number
  color?: string
  trackColor?: string
  ariaLabel?: string
  className?: string
  style?: CSSProperties
}

const SIZE_PX: Record<CircularProgressSize, number> = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 24
}

export function CircularProgress({
  value,
  size = 'sm',
  strokeWidth,
  color = 'var(--color-accent)',
  trackColor = 'transparent',
  ariaLabel,
  className,
  style
}: CircularProgressProps): React.ReactElement {
  const px = SIZE_PX[size]
  const sw = strokeWidth ?? Math.max(1.5, Math.round(px / 8))
  const radius = (px - sw) / 2
  const circumference = 2 * Math.PI * radius

  const indeterminate = value === null || value === undefined
  const clamped = indeterminate ? 0 : Math.max(0, Math.min(value, 100))
  const dashOffset = circumference - (clamped / 100) * circumference

  return (
    <span
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : clamped}
      aria-busy={indeterminate || undefined}
      className={cn('ui-native-circular-progress', className)}
      style={{
        display: 'inline-flex',
        width: px,
        height: px,
        ...style
      }}
    >
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        style={{
          animation: indeterminate ? 'button-spin 800ms linear infinite' : undefined,
          transformOrigin: 'center'
        }}
      >
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={sw}
        />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.75 : dashOffset}
          transform={`rotate(-90 ${px / 2} ${px / 2})`}
          style={{
            transition: indeterminate
              ? undefined
              : 'stroke-dashoffset var(--duration-standard) var(--ease-standard)'
          }}
        />
      </svg>
    </span>
  )
}
