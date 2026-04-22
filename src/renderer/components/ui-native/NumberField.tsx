import { forwardRef, useCallback, type KeyboardEvent } from 'react'
import { TextField, type TextFieldProps } from './TextField'
import { Stepper } from './Stepper'

export interface NumberFieldProps
  extends Omit<TextFieldProps, 'type' | 'value' | 'defaultValue' | 'onChange' | 'suffix' | 'characterCount' | 'maxLength'> {
  value: number | null
  onChange: (next: number | null) => void
  min?: number
  max?: number
  step?: number
  /** Decimal places to round to on change. Default 0 (integer). */
  precision?: number
}

function clamp(n: number, min: number | undefined, max: number | undefined): number {
  if (min != null && n < min) return min
  if (max != null && n > max) return max
  return n
}

function round(n: number, precision: number): number {
  const factor = 10 ** precision
  return Math.round(n * factor) / factor
}

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  { value, onChange, min, max, step = 1, precision = 0, inputSize = 'md', disabled, readOnly, onKeyDown, ...rest },
  ref
) {
  const adjust = useCallback(
    (delta: number) => {
      const current = value ?? 0
      const next = clamp(round(current + delta, precision), min, max)
      onChange(next)
    },
    [value, min, max, precision, onChange]
  )

  const handleInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value
      if (raw === '' || raw === '-') {
        onChange(null)
        return
      }
      const parsed = Number(raw)
      if (Number.isNaN(parsed)) return
      onChange(clamp(round(parsed, precision), min, max))
    },
    [min, max, precision, onChange]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        adjust(step)
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        adjust(-step)
      }
      onKeyDown?.(event)
    },
    [adjust, step, onKeyDown]
  )

  const canIncrement = max == null || (value ?? 0) + step <= max
  const canDecrement = min == null || (value ?? 0) - step >= min
  const interactive = !disabled && !readOnly

  const stepperSize = inputSize === 'lg' ? 'md' : 'sm'

  return (
    <TextField
      ref={ref}
      inputSize={inputSize}
      inputMode="numeric"
      type="text"
      value={value == null ? '' : String(value)}
      onChange={handleInput}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      readOnly={readOnly}
      suffix={
        interactive ? (
          <Stepper
            size={stepperSize}
            onIncrement={() => adjust(step)}
            onDecrement={() => adjust(-step)}
            canIncrement={canIncrement}
            canDecrement={canDecrement}
          />
        ) : undefined
      }
      {...rest}
    />
  )
})
