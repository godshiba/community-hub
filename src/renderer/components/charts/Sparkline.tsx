import { memo, type CSSProperties } from 'react'

export interface SparklineProps {
  data: ReadonlyArray<number>
  width?: number
  height?: number
  /** CSS color or var() reference. Defaults to accent. */
  stroke?: string
  /** Optional fill under the line for area-style sparkline. */
  fill?: string
  strokeWidth?: number
  className?: string
  style?: CSSProperties
  ariaLabel?: string
}

/**
 * Minimal SVG sparkline — no axes, grid, or tooltips per spec § Charts.
 * Accepts a numeric series and renders a 2px stroke polyline. If the series
 * is empty or constant, renders a flat hairline.
 */
export const Sparkline = memo(function Sparkline({
  data,
  width = 80,
  height = 24,
  stroke = 'var(--color-accent)',
  fill,
  strokeWidth = 2,
  className,
  style,
  ariaLabel
}: SparklineProps): React.ReactElement {
  const merged: CSSProperties = {
    display: 'block',
    width,
    height,
    overflow: 'visible',
    ...style
  }

  if (data.length === 0) {
    return (
      <svg
        role="img"
        aria-label={ariaLabel ?? 'No data'}
        viewBox={`0 0 ${width} ${height}`}
        className={className}
        style={merged}
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--color-divider-strong)"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      </svg>
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = data.length > 1 ? width / (data.length - 1) : 0
  const padY = strokeWidth / 2

  const points = data.map((v, i) => {
    const x = i * stepX
    // Flip Y so larger values appear higher
    const y = padY + (height - padY * 2) * (1 - (v - min) / range)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  const polyline = points.join(' ')
  const area = fill
    ? `M0,${height} L${points.join(' L')} L${width},${height} Z`
    : null

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={merged}
      preserveAspectRatio="none"
    >
      {area && <path d={area} fill={fill} />}
      <polyline
        points={polyline}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
})
