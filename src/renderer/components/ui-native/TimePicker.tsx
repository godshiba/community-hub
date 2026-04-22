import { useCallback, useMemo, type CSSProperties } from 'react'
import { NumberField } from './NumberField'
import { cn } from '@renderer/lib/utils'

export interface TimeValue {
  hours: number
  minutes: number
}

export type TimePickerMode = '12h' | '24h'

export interface TimePickerProps {
  value: TimeValue | null
  onChange: (next: TimeValue | null) => void
  mode?: TimePickerMode
  /** Minute step for the stepper (does not constrain typed input). */
  minuteStep?: number
  disabled?: boolean
  readOnly?: boolean
  error?: string | boolean
  hint?: React.ReactNode
  inputSize?: 'sm' | 'md' | 'lg'
  className?: string
  style?: CSSProperties
  ariaLabel?: string
}

function normalize(value: TimeValue | null): TimeValue | null {
  if (!value) return null
  const hours = ((value.hours % 24) + 24) % 24
  const minutes = ((value.minutes % 60) + 60) % 60
  return { hours, minutes }
}

function to12h(hours24: number): { display: number; period: 'AM' | 'PM' } {
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const display = hours24 % 12 === 0 ? 12 : hours24 % 12
  return { display, period }
}

function from12h(display: number, period: 'AM' | 'PM'): number {
  const base = display % 12
  return period === 'PM' ? base + 12 : base
}

export function TimePicker({
  value,
  onChange,
  mode = '24h',
  minuteStep = 5,
  disabled = false,
  readOnly = false,
  error,
  hint,
  inputSize = 'md',
  className,
  style,
  ariaLabel
}: TimePickerProps): React.ReactElement {
  const current = useMemo(() => normalize(value), [value])
  const hasError = Boolean(error)
  const errorText = typeof error === 'string' ? error : undefined

  const hoursMin = mode === '12h' ? 1 : 0
  const hoursMax = mode === '12h' ? 12 : 23

  const displayHours = useMemo(() => {
    if (current == null) return null
    return mode === '12h' ? to12h(current.hours).display : current.hours
  }, [current, mode])

  const period: 'AM' | 'PM' = current ? to12h(current.hours).period : 'AM'

  const emit = useCallback(
    (next: Partial<TimeValue> & { period?: 'AM' | 'PM'; displayHours?: number }) => {
      const baseHours = current?.hours ?? 0
      const baseMinutes = current?.minutes ?? 0

      let hours = next.hours ?? baseHours
      if (next.displayHours != null) {
        hours = mode === '12h' ? from12h(next.displayHours, next.period ?? period) : next.displayHours
      } else if (next.period && mode === '12h') {
        const dh = displayHours ?? 12
        hours = from12h(dh, next.period)
      }

      const minutes = next.minutes ?? baseMinutes
      onChange(normalize({ hours, minutes }))
    },
    [current, displayHours, mode, onChange, period]
  )

  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    ...style
  }

  const row: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6
  }

  const colon: CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: inputSize === 'lg' ? 14 : inputSize === 'sm' ? 12 : 13,
    color: 'var(--color-fg-tertiary)',
    fontVariantNumeric: 'tabular-nums'
  }

  const periodBtn = (target: 'AM' | 'PM'): CSSProperties => ({
    height: inputSize === 'lg' ? 34 : inputSize === 'sm' ? 24 : 28,
    paddingInline: 10,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-divider)',
    background:
      period === target ? 'var(--color-accent)' : 'var(--color-surface-card-raised)',
    color: period === target ? '#ffffff' : 'var(--color-fg-secondary)',
    fontFamily: 'var(--font-sans)',
    fontSize: inputSize === 'lg' ? 13 : 12,
    cursor: disabled || readOnly ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.38 : 1,
    outline: 'none'
  })

  return (
    <div className={cn(className)} style={wrap} role="group" aria-label={ariaLabel}>
      <div style={row}>
        <NumberField
          value={displayHours}
          onChange={(next) => {
            if (next == null) {
              onChange(null)
              return
            }
            emit({ displayHours: next })
          }}
          min={hoursMin}
          max={hoursMax}
          step={1}
          inputSize={inputSize}
          disabled={disabled}
          readOnly={readOnly}
          fullWidth={false}
          containerStyle={{ width: 72 }}
          aria-label="Hours"
        />
        <span aria-hidden style={colon}>:</span>
        <NumberField
          value={current?.minutes ?? null}
          onChange={(next) => {
            if (next == null) {
              onChange(null)
              return
            }
            emit({ minutes: next })
          }}
          min={0}
          max={59}
          step={minuteStep}
          inputSize={inputSize}
          disabled={disabled}
          readOnly={readOnly}
          fullWidth={false}
          containerStyle={{ width: 72 }}
          aria-label="Minutes"
        />
        {mode === '12h' && (
          <div style={{ display: 'inline-flex', gap: 4 }}>
            <button
              type="button"
              disabled={disabled || readOnly}
              onClick={() => emit({ period: 'AM' })}
              style={periodBtn('AM')}
              aria-pressed={period === 'AM'}
            >
              AM
            </button>
            <button
              type="button"
              disabled={disabled || readOnly}
              onClick={() => emit({ period: 'PM' })}
              style={periodBtn('PM')}
              aria-pressed={period === 'PM'}
            >
              PM
            </button>
          </div>
        )}
      </div>
      {(errorText || hint) && (
        <span
          style={{
            fontSize: 12,
            lineHeight: 1.4,
            color: hasError ? 'var(--color-error)' : 'var(--color-fg-tertiary)'
          }}
        >
          {errorText ?? hint}
        </span>
      )}
    </div>
  )
}
