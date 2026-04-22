import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react'
import { cn } from '@renderer/lib/utils'

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean
  onChange: (next: boolean) => void
  size?: 'sm' | 'md'
  /** Accessible label when not wrapped in a <label>. */
  label?: string
}

const SIZE: Record<NonNullable<ToggleProps['size']>, { width: number; height: number; thumb: number; pad: number }> = {
  sm: { width: 28, height: 16, thumb: 12, pad: 2 },
  md: { width: 36, height: 22, thumb: 18, pad: 2 }
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { checked, onChange, size = 'md', label, disabled, className, style, ...rest },
  ref
) {
  const sz = SIZE[size]
  const thumbOffset = checked ? sz.width - sz.thumb - sz.pad : sz.pad

  const track: CSSProperties = {
    position: 'relative',
    width: sz.width,
    height: sz.height,
    borderRadius: 'var(--radius-full)',
    background: checked ? 'var(--color-accent)' : 'var(--color-surface-input)',
    border: `1px solid ${checked ? 'color-mix(in oklch, var(--color-accent) 65%, black)' : 'var(--color-divider)'}`,
    transition:
      'background var(--duration-standard) var(--ease-standard), border-color var(--duration-standard) var(--ease-standard)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.38 : 1,
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    outline: 'none',
    ...style
  }

  const thumb: CSSProperties = {
    position: 'absolute',
    top: sz.pad,
    left: thumbOffset,
    width: sz.thumb,
    height: sz.thumb,
    borderRadius: '50%',
    background: '#ffffff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(0,0,0,0.2)',
    transition: 'left var(--duration-standard) var(--ease-standard)'
  }

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={cn('ui-native-toggle', className)}
      style={track}
      onClick={() => onChange(!checked)}
      {...rest}
    >
      <span aria-hidden style={thumb} />
    </button>
  )
})
