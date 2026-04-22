import { Slider as RadixSlider } from 'radix-ui'
import { forwardRef, type CSSProperties } from 'react'
import { cn } from '@renderer/lib/utils'

export interface SliderProps {
  value: number
  onChange: (next: number) => void
  onCommit?: (next: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  ariaLabel?: string
  className?: string
  style?: CSSProperties
}

export const Slider = forwardRef<HTMLSpanElement, SliderProps>(function Slider(
  { value, onChange, onCommit, min = 0, max = 100, step = 1, disabled = false, ariaLabel, className, style },
  ref
) {
  return (
    <RadixSlider.Root
      ref={ref as unknown as React.Ref<HTMLSpanElement>}
      value={[value]}
      onValueChange={(v) => onChange(v[0]!)}
      onValueCommit={(v) => onCommit?.(v[0]!)}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn('ui-native-slider', className)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: 20,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.38 : 1,
        touchAction: 'none',
        userSelect: 'none',
        ...style
      }}
    >
      <RadixSlider.Track
        style={{
          position: 'relative',
          flex: 1,
          height: 4,
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-surface-input)',
          boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.35)'
        }}
      >
        <RadixSlider.Range
          style={{
            position: 'absolute',
            height: '100%',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-accent)'
          }}
        />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        aria-label={ariaLabel}
        className="ui-native-slider-thumb"
        style={{
          display: 'block',
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#ffffff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(0,0,0,0.25)',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'grab'
        }}
      />
    </RadixSlider.Root>
  )
})
