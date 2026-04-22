import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'

export type CheckedState = boolean | 'indeterminate'

export interface CheckboxProps {
  checked: CheckedState
  onChange: (next: boolean) => void
  disabled?: boolean
  label?: ReactNode
  id?: string
  className?: string
  style?: CSSProperties
}

function CheckGlyph(): React.ReactElement {
  return (
    <svg viewBox="0 0 12 10" width="12" height="10" aria-hidden style={{ display: 'block' }}>
      <path
        d="M1 5.2L4.3 8.5L11 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DashGlyph(): React.ReactElement {
  return (
    <svg viewBox="0 0 12 2" width="12" height="2" aria-hidden style={{ display: 'block' }}>
      <line x1="1" y1="1" x2="11" y2="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { checked, onChange, disabled = false, label, id, className, style },
  ref
) {
  const on = checked === true || checked === 'indeterminate'

  const box: CSSProperties = {
    width: 16,
    height: 16,
    borderRadius: 4,
    border: `1px solid ${on ? 'color-mix(in oklch, var(--color-accent) 65%, black)' : 'var(--color-divider-strong)'}`,
    background: on ? 'var(--color-accent)' : 'var(--color-surface-input)',
    color: 'var(--color-accent-fg-on-fill)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.38 : 1,
    boxShadow: on ? undefined : 'inset 0 1px 0 rgba(0,0,0,0.35)',
    transition:
      'background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)',
    padding: 0
  }

  const button = (
    <button
      ref={ref}
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked === 'indeterminate' ? 'mixed' : checked}
      disabled={disabled}
      className={cn('ui-native-checkbox', className)}
      style={box}
      onClick={() => onChange(checked === true ? false : true)}
    >
      {checked === 'indeterminate' ? <DashGlyph /> : checked === true ? <CheckGlyph /> : null}
    </button>
  )

  if (!label) return <span style={{ display: 'inline-flex', ...style }}>{button}</span>

  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        color: disabled ? 'var(--color-fg-disabled)' : 'var(--color-fg-primary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style
      }}
    >
      {button}
      <span>{label}</span>
    </label>
  )
})
