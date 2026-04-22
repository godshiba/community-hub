import { memo, type CSSProperties } from 'react'

export type SkeletonVariant = 'line' | 'circle' | 'rect'

export interface SkeletonProps {
  variant?: SkeletonVariant
  width?: number | string
  height?: number | string
  radius?: 'sm' | 'md' | 'lg' | 'full'
  className?: string
  style?: CSSProperties
}

const RADIUS: Record<NonNullable<SkeletonProps['radius']>, string> = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  full: 'var(--radius-full)'
}

function defaults(variant: SkeletonVariant): {
  width: number | string
  height: number | string
  radius: NonNullable<SkeletonProps['radius']>
} {
  switch (variant) {
    case 'circle':
      return { width: 28, height: 28, radius: 'full' }
    case 'rect':
      return { width: '100%', height: 96, radius: 'md' }
    case 'line':
    default:
      return { width: '100%', height: 10, radius: 'sm' }
  }
}

export const Skeleton = memo(function Skeleton({
  variant = 'line',
  width,
  height,
  radius,
  className,
  style
}: SkeletonProps): React.ReactElement {
  const d = defaults(variant)
  const merged: CSSProperties = {
    display: 'block',
    width: width ?? d.width,
    height: height ?? d.height,
    borderRadius: RADIUS[radius ?? d.radius],
    background:
      'linear-gradient(90deg, var(--color-surface-card) 0%, var(--color-surface-card-raised) 50%, var(--color-surface-card) 100%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-shimmer 1.2s ease-in-out infinite',
    ...style
  }

  return <span aria-hidden className={className} style={merged} />
})
