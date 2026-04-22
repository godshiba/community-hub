import { Popover } from 'radix-ui'
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode
} from 'react'
import { cn } from '@renderer/lib/utils'
import type { SelectOption } from './Select'

export interface ComboBoxProps<T extends string = string> {
  value: T | null
  onChange: (next: T) => void
  options: ReadonlyArray<SelectOption<T>>
  placeholder?: string
  emptyMessage?: ReactNode
  disabled?: boolean
  fullWidth?: boolean
  ariaLabel?: string
  className?: string
  style?: CSSProperties
}

function defaultFilter<T extends string>(options: ReadonlyArray<SelectOption<T>>, query: string): Array<SelectOption<T>> {
  if (!query) return options.slice()
  const lower = query.toLowerCase()
  return options.filter((o) => String(o.label).toLowerCase().includes(lower) || o.value.toLowerCase().includes(lower))
}

export function ComboBox<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  emptyMessage = 'No matches',
  disabled = false,
  fullWidth = false,
  ariaLabel,
  className,
  style
}: ComboBoxProps<T>): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value])
  const filtered = useMemo(() => defaultFilter(options, query), [options, query])

  const select = useCallback(
    (next: T) => {
      onChange(next)
      setQuery('')
      setOpen(false)
    },
    [onChange]
  )

  const handleKey = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(filtered.length - 1, i + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const pick = filtered[active]
      if (pick && !pick.disabled) select(pick.value)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const shell: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    width: fullWidth ? '100%' : undefined,
    height: 28,
    paddingInline: 10,
    background: 'var(--color-surface-input)',
    border: '1px solid var(--color-divider)',
    borderRadius: 'var(--radius-md)',
    fontSize: 13,
    color: 'var(--color-fg-primary)',
    cursor: disabled ? 'not-allowed' : 'text',
    opacity: disabled ? 0.38 : 1,
    boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.35)',
    transition:
      'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
    ...style
  }

  const displayValue = open ? query : (selected ? String(selected.label) : query)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div className={cn('ui-native-field', className)} style={shell}>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label={ariaLabel}
            aria-expanded={open}
            aria-autocomplete="list"
            disabled={disabled}
            value={displayValue}
            placeholder={placeholder}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
              setOpen(true)
            }}
            onKeyDown={handleKey}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'inherit',
              font: 'inherit',
              padding: 0
            }}
          />
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{
            width: 'var(--radix-popover-trigger-width)',
            maxHeight: 260,
            overflowY: 'auto',
            background: 'var(--color-surface-card-raised)',
            border: '1px solid var(--color-divider-strong)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-popover)',
            padding: 4,
            zIndex: 50
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '8px 10px', fontSize: 13, color: 'var(--color-fg-tertiary)' }}>{emptyMessage}</div>
          ) : (
            filtered.map((opt, idx) => {
              const highlighted = idx === active
              const isSelected = opt.value === value
              const color = opt.disabled ? 'var(--color-fg-disabled)' : highlighted ? 'var(--color-accent)' : 'var(--color-fg-primary)'
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => !opt.disabled && select(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    gap: 8,
                    paddingInline: 8,
                    paddingBlock: 6,
                    textAlign: 'left',
                    fontSize: 13,
                    color,
                    background: highlighted ? 'var(--color-accent-fill)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                    fontWeight: isSelected ? 600 : 500
                  }}
                >
                  <span style={{ flex: 1 }}>{opt.label}</span>
                </button>
              )
            })
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
