import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode
} from 'react'
import { cn } from '@renderer/lib/utils'

export type SegmentedControlSize = 'sm' | 'md' | 'lg'

export interface SegmentedControlOption<T extends string> {
  value: T
  label: ReactNode
  disabled?: boolean
  ariaLabel?: string
}

export interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (next: T) => void
  options: ReadonlyArray<SegmentedControlOption<T>>
  size?: SegmentedControlSize
  disabled?: boolean
  fullWidth?: boolean
  ariaLabel?: string
  className?: string
  style?: CSSProperties
}

const SIZE: Record<SegmentedControlSize, { height: number; fontSize: number; paddingInline: number; padding: number }> = {
  sm: { height: 24, fontSize: 12, paddingInline: 10, padding: 2 },
  md: { height: 28, fontSize: 13, paddingInline: 12, padding: 2 },
  lg: { height: 34, fontSize: 14, paddingInline: 14, padding: 3 }
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  disabled = false,
  fullWidth = false,
  ariaLabel,
  className,
  style
}: SegmentedControlProps<T>): React.ReactElement {
  const sz = SIZE[size]
  const trackRef = useRef<HTMLDivElement | null>(null)
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([])
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)

  const selectedIndex = useMemo(() => options.findIndex((o) => o.value === value), [options, value])

  useLayoutEffect(() => {
    const track = trackRef.current
    const btn = buttonsRef.current[selectedIndex]
    if (!track || !btn) {
      setIndicator(null)
      return
    }
    const trackRect = track.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    setIndicator({
      left: btnRect.left - trackRect.left,
      width: btnRect.width
    })
  }, [selectedIndex, options.length, size, fullWidth])

  const track: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    padding: sz.padding,
    gap: 0,
    height: sz.height,
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-surface-input)',
    border: '1px solid var(--color-divider)',
    boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.25)',
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.38 : 1,
    cursor: disabled ? 'not-allowed' : undefined,
    ...style
  }

  const segment = (selected: boolean, isDisabled: boolean): CSSProperties => ({
    position: 'relative',
    zIndex: 1,
    flex: fullWidth ? 1 : undefined,
    height: '100%',
    paddingInline: sz.paddingInline,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    border: 'none',
    background: 'transparent',
    color: selected ? 'var(--color-fg-primary)' : 'var(--color-fg-secondary)',
    fontFamily: 'var(--font-sans)',
    fontSize: sz.fontSize,
    fontWeight: selected ? 500 : 400,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    outline: 'none',
    borderRadius: 'calc(var(--radius-md) - 2px)',
    transition: 'color var(--duration-fast) var(--ease-standard)',
    whiteSpace: 'nowrap'
  })

  const indicatorStyle: CSSProperties = {
    position: 'absolute',
    top: sz.padding,
    height: sz.height - sz.padding * 2 - 2,
    left: indicator?.left ?? 0,
    width: indicator?.width ?? 0,
    background: 'var(--color-surface-card-raised)',
    borderRadius: 'calc(var(--radius-md) - 2px)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(0,0,0,0.35)',
    transition:
      'left var(--duration-standard) var(--ease-standard), width var(--duration-standard) var(--ease-standard)',
    opacity: indicator ? 1 : 0,
    pointerEvents: 'none',
    zIndex: 0
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') {
      return
    }
    event.preventDefault()
    const last = options.length - 1
    let nextIndex = index
    if (event.key === 'ArrowLeft') nextIndex = index <= 0 ? last : index - 1
    else if (event.key === 'ArrowRight') nextIndex = index >= last ? 0 : index + 1
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = last

    let tries = 0
    while (options[nextIndex]?.disabled && tries <= options.length) {
      nextIndex = (nextIndex + (event.key === 'ArrowLeft' ? -1 : 1) + options.length) % options.length
      tries += 1
    }
    const nextOption = options[nextIndex]
    if (!nextOption || nextOption.disabled) return
    onChange(nextOption.value)
    buttonsRef.current[nextIndex]?.focus()
  }

  return (
    <div
      ref={trackRef}
      role="tablist"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={cn('ui-native-segmented', className)}
      style={track}
    >
      <span aria-hidden style={indicatorStyle} />
      {options.map((option, index) => {
        const isSelected = option.value === value
        const isDisabled = disabled || option.disabled === true
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonsRef.current[index] = el
            }}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-label={option.ariaLabel}
            tabIndex={isSelected ? 0 : -1}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            style={segment(isSelected, isDisabled)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
