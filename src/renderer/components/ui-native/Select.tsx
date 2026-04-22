import { Select as RadixSelect } from 'radix-ui'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'

export type SelectSize = 'sm' | 'md' | 'lg'

export interface SelectOption<T extends string = string> {
  value: T
  label: ReactNode
  disabled?: boolean
}

export interface SelectProps<T extends string = string> {
  value: T | null
  onChange: (next: T) => void
  options: ReadonlyArray<SelectOption<T>>
  placeholder?: string
  size?: SelectSize
  disabled?: boolean
  ariaLabel?: string
  fullWidth?: boolean
  className?: string
  style?: CSSProperties
}

const SIZE: Record<SelectSize, { height: number; fontSize: number; paddingInline: number }> = {
  sm: { height: 24, fontSize: 12, paddingInline: 8 },
  md: { height: 28, fontSize: 13, paddingInline: 10 },
  lg: { height: 34, fontSize: 14, paddingInline: 12 }
}

function Chevrons(): React.ReactElement {
  return (
    <svg viewBox="0 0 8 12" width="8" height="12" aria-hidden style={{ display: 'block', color: 'currentColor' }}>
      <path d="M0 4 L4 0 L8 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M0 8 L4 12 L8 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Check(): React.ReactElement {
  return (
    <svg viewBox="0 0 12 10" width="12" height="10" aria-hidden style={{ display: 'block' }}>
      <path d="M1 5.2L4.3 8.5L11 1.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Select<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  size = 'md',
  disabled = false,
  ariaLabel,
  fullWidth = false,
  className,
  style
}: SelectProps<T>): React.ReactElement {
  const sz = SIZE[size]

  const trigger: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: fullWidth ? '100%' : undefined,
    height: sz.height,
    paddingInline: sz.paddingInline,
    background: 'var(--color-surface-card-raised)',
    color: 'var(--color-fg-primary)',
    border: '1px solid var(--color-divider)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-sans)',
    fontSize: sz.fontSize,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.38 : 1,
    outline: 'none',
    transition:
      'background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
    ...style
  }

  return (
    <RadixSelect.Root value={value ?? undefined} onValueChange={(v) => onChange(v as T)} disabled={disabled}>
      <RadixSelect.Trigger
        aria-label={ariaLabel}
        className={cn('ui-native-select-trigger', className)}
        style={trigger}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon style={{ color: 'var(--color-fg-tertiary)', display: 'inline-flex' }}>
          <Chevrons />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="ui-native-select-content"
          style={{
            minWidth: 'var(--radix-select-trigger-width)',
            maxHeight: 320,
            overflow: 'hidden',
            background: 'var(--color-surface-card-raised)',
            border: '1px solid var(--color-divider-strong)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-popover)',
            color: 'var(--color-fg-primary)',
            zIndex: 50,
            padding: 4
          }}
        >
          <RadixSelect.Viewport>
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="ui-native-select-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  paddingInline: 8,
                  paddingBlock: 6,
                  fontSize: 13,
                  borderRadius: 'var(--radius-sm)',
                  cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  opacity: opt.disabled ? 0.38 : 1,
                  outline: 'none'
                }}
              >
                <RadixSelect.ItemIndicator style={{ display: 'inline-flex', width: 14, color: 'var(--color-accent)' }}>
                  <Check />
                </RadixSelect.ItemIndicator>
                <span style={{ flex: 1, paddingLeft: 4 }}>
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                </span>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}
