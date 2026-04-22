import { memo, type CSSProperties } from 'react'

export interface StepperProps {
  onIncrement: () => void
  onDecrement: () => void
  canIncrement?: boolean
  canDecrement?: boolean
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
  style?: CSSProperties
}

const SIZE: Record<NonNullable<StepperProps['size']>, { height: number; width: number }> = {
  sm: { height: 24, width: 18 },
  md: { height: 28, width: 20 }
}

function Arrow({ direction }: { direction: 'up' | 'down' }): React.ReactElement {
  return (
    <svg viewBox="0 0 8 5" width="8" height="5" aria-hidden style={{ display: 'block' }}>
      <path
        d={direction === 'up' ? 'M0 5L4 0L8 5Z' : 'M0 0L4 5L8 0Z'}
        fill="currentColor"
      />
    </svg>
  )
}

export const Stepper = memo(function Stepper({
  onIncrement,
  onDecrement,
  canIncrement = true,
  canDecrement = true,
  size = 'md',
  disabled = false,
  className,
  style
}: StepperProps): React.ReactElement {
  const sz = SIZE[size]
  const wrapper: CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'column',
    width: sz.width,
    height: sz.height,
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    border: '1px solid var(--color-divider)',
    flexShrink: 0,
    ...style
  }

  const btn: CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-surface-card-raised)',
    color: 'var(--color-fg-secondary)',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    outline: 'none'
  }

  const topBtn: CSSProperties = { ...btn, borderBottom: '1px solid var(--color-divider)' }
  const bottomBtn: CSSProperties = { ...btn }

  const upDisabled = disabled || !canIncrement
  const downDisabled = disabled || !canDecrement

  return (
    <span className={className} style={wrapper}>
      <button
        type="button"
        tabIndex={-1}
        disabled={upDisabled}
        aria-label="Increment"
        onClick={onIncrement}
        className="ui-native-stepper-btn"
        style={{ ...topBtn, opacity: upDisabled ? 0.38 : 1, cursor: upDisabled ? 'not-allowed' : 'pointer' }}
      >
        <Arrow direction="up" />
      </button>
      <button
        type="button"
        tabIndex={-1}
        disabled={downDisabled}
        aria-label="Decrement"
        onClick={onDecrement}
        className="ui-native-stepper-btn"
        style={{ ...bottomBtn, opacity: downDisabled ? 0.38 : 1, cursor: downDisabled ? 'not-allowed' : 'pointer' }}
      >
        <Arrow direction="down" />
      </button>
    </span>
  )
})
