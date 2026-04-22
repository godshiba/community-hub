import { createContext, useContext, useId, useMemo, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'

interface RadioContext {
  name: string
  value: string | null
  onChange: (next: string) => void
  disabled: boolean
  orientation: 'horizontal' | 'vertical'
}

const RadioCtx = createContext<RadioContext | null>(null)

export interface RadioGroupProps {
  value: string | null
  onChange: (next: string) => void
  name?: string
  disabled?: boolean
  orientation?: 'horizontal' | 'vertical'
  children: ReactNode
  className?: string
  style?: CSSProperties
  ariaLabel?: string
}

export function RadioGroup({
  value,
  onChange,
  name,
  disabled = false,
  orientation = 'vertical',
  children,
  className,
  style,
  ariaLabel
}: RadioGroupProps): React.ReactElement {
  const generatedName = useId()
  const ctx = useMemo<RadioContext>(
    () => ({ name: name ?? generatedName, value, onChange, disabled, orientation }),
    [name, generatedName, value, onChange, disabled, orientation]
  )

  const layout: CSSProperties = {
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    gap: orientation === 'vertical' ? 8 : 16,
    ...style
  }

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={className} style={layout}>
      <RadioCtx.Provider value={ctx}>{children}</RadioCtx.Provider>
    </div>
  )
}

export interface RadioProps {
  value: string
  label: ReactNode
  hint?: ReactNode
  disabled?: boolean
  className?: string
  style?: CSSProperties
}

export function Radio({ value, label, hint, disabled = false, className, style }: RadioProps): React.ReactElement {
  const ctx = useContext(RadioCtx)
  if (!ctx) {
    throw new Error('Radio must be used inside RadioGroup')
  }
  const isDisabled = disabled || ctx.disabled
  const selected = ctx.value === value

  const dot: CSSProperties = {
    width: 16,
    height: 16,
    borderRadius: '50%',
    border: `1px solid ${selected ? 'color-mix(in oklch, var(--color-accent) 65%, black)' : 'var(--color-divider-strong)'}`,
    background: selected ? 'var(--color-accent)' : 'var(--color-surface-input)',
    boxShadow: selected ? undefined : 'inset 0 1px 0 rgba(0,0,0,0.35)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.38 : 1,
    padding: 0,
    transition:
      'background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)'
  }

  const inner: CSSProperties = {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#ffffff',
    opacity: selected ? 1 : 0,
    transition: 'opacity var(--duration-fast) var(--ease-standard)'
  }

  return (
    <label
      className={cn(className)}
      style={{
        display: 'inline-flex',
        alignItems: hint ? 'flex-start' : 'center',
        gap: 8,
        fontSize: 13,
        color: isDisabled ? 'var(--color-fg-disabled)' : 'var(--color-fg-primary)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        ...style
      }}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        disabled={isDisabled}
        onClick={() => ctx.onChange(value)}
        name={ctx.name}
        className="ui-native-radio"
        style={dot}
      >
        <span aria-hidden style={inner} />
      </button>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span>{label}</span>
        {hint && <span style={{ fontSize: 12, color: 'var(--color-fg-tertiary)' }}>{hint}</span>}
      </span>
    </label>
  )
}
