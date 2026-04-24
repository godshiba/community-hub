import { useCallback, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { DayPicker, type Matcher } from 'react-day-picker'
import 'react-day-picker/style.css'
import { cn } from '@renderer/lib/utils'
import { Button } from './Button'
import { Popover } from './Popover'

export interface DatePickerProps {
  value: Date | null
  onChange: (next: Date | null) => void
  placeholder?: string
  disabled?: boolean
  ariaLabel?: string
  minDate?: Date
  maxDate?: Date
  locale?: string
  fullWidth?: boolean
  className?: string
  style?: CSSProperties
  renderTrigger?: (state: { value: Date | null; placeholder: string }) => ReactNode
}

function formatDate(date: Date, locale: string | undefined): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

function CalendarGlyph(): React.ReactElement {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
      <rect x="1" y="2" width="10" height="9" rx="1" stroke="currentColor" fill="none" />
      <path d="M1 5 L11 5" stroke="currentColor" strokeWidth="1" />
      <path d="M4 1 L4 3 M8 1 L8 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date…',
  disabled = false,
  ariaLabel,
  minDate,
  maxDate,
  locale,
  fullWidth = false,
  className,
  style,
  renderTrigger
}: DatePickerProps): React.ReactElement {
  const [open, setOpen] = useState<boolean>(false)

  const handleSelect = useCallback(
    (next: Date | undefined): void => {
      onChange(next ?? null)
      setOpen(false)
    },
    [onChange]
  )

  const label = useMemo(() => {
    if (!value) return placeholder
    return formatDate(value, locale)
  }, [value, placeholder, locale])

  const disabledMatcher = useMemo<Matcher[] | undefined>(() => {
    const matchers: Matcher[] = []
    if (minDate) matchers.push({ before: minDate })
    if (maxDate) matchers.push({ after: maxDate })
    return matchers.length ? matchers : undefined
  }, [minDate, maxDate])

  const trigger = renderTrigger ? (
    renderTrigger({ value, placeholder })
  ) : (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      aria-expanded={open}
      className={cn('ui-native-datepicker-trigger', className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        width: fullWidth ? '100%' : undefined,
        minWidth: 160,
        height: 28,
        paddingInline: 10,
        background: 'var(--color-surface-card-raised)',
        color: value ? 'var(--color-fg-primary)' : 'var(--color-fg-tertiary)',
        border: '1px solid var(--color-divider)',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.38 : 1,
        outline: 'none',
        ...style
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ display: 'inline-flex', color: 'var(--color-fg-tertiary)' }}>
        <CalendarGlyph />
      </span>
    </button>
  )

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      side="bottom"
      align="start"
      sideOffset={6}
      padding={8}
      ariaLabel={ariaLabel}
      className="ui-native-datepicker-popover"
    >
      <div
        className="ui-native-datepicker"
        style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-fg-primary)' }}
      >
        <DayPicker
          mode="single"
          selected={value ?? undefined}
          onSelect={handleSelect}
          disabled={disabledMatcher}
          showOutsideDays
          weekStartsOn={1}
        />
        {value && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              paddingTop: 8,
              borderTop: '1px solid var(--color-divider)'
            }}
          >
            <Button variant="plain" size="sm" onClick={() => handleSelect(undefined)}>
              Clear
            </Button>
          </div>
        )}
      </div>
    </Popover>
  )
}
