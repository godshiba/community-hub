import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'

export type ListRowDensity = 'compact' | 'comfortable'

export interface ListRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  density?: ListRowDensity
  selected?: boolean
  disabled?: boolean
  interactive?: boolean
  danger?: boolean
  dividerBelow?: boolean
  onSelect?: () => void
}

const HEIGHT: Record<ListRowDensity, number> = {
  compact: 32,
  comfortable: 52
}

export const ListRow = forwardRef<HTMLDivElement, ListRowProps>(function ListRow(
  {
    leading,
    title,
    subtitle,
    trailing,
    density = 'comfortable',
    selected = false,
    disabled = false,
    interactive = true,
    danger = false,
    dividerBelow = false,
    onSelect,
    className,
    style,
    onClick,
    onKeyDown,
    tabIndex,
    role,
    ...rest
  },
  ref
) {
  const height = HEIGHT[density]

  const resolvedRole = role ?? (interactive ? 'button' : undefined)
  const resolvedTabIndex =
    tabIndex !== undefined ? tabIndex : interactive && !disabled ? 0 : undefined

  const merged: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minHeight: height,
    paddingInline: 10,
    paddingBlock: density === 'compact' ? 4 : 8,
    fontFamily: 'var(--font-sans)',
    color: danger ? 'var(--color-error)' : 'var(--color-fg-primary)',
    background: selected ? 'var(--color-accent-fill)' : 'transparent',
    borderRadius: 'var(--radius-sm)',
    cursor: interactive && !disabled ? 'pointer' : 'default',
    opacity: disabled ? 0.38 : 1,
    outline: 'none',
    userSelect: 'none',
    transition:
      'background var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
    borderBottom: dividerBelow ? '1px solid var(--color-divider)' : undefined,
    ...style
  }

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (onKeyDown) onKeyDown(e)
    if (!interactive || disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.()
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (onClick) onClick(e)
    if (!interactive || disabled || e.defaultPrevented) return
    onSelect?.()
  }

  return (
    <div
      ref={ref}
      role={resolvedRole}
      aria-pressed={interactive && resolvedRole === 'button' ? selected : undefined}
      aria-selected={
        interactive && resolvedRole !== 'button' ? selected : undefined
      }
      aria-disabled={disabled || undefined}
      data-selected={selected ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      data-density={density}
      tabIndex={resolvedTabIndex}
      onClick={handleClick}
      onKeyDown={handleKey}
      className={cn('ui-native-list-row', className)}
      style={merged}
      {...rest}
    >
      {leading && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'var(--color-fg-secondary)'
          }}
        >
          {leading}
        </span>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minWidth: 0,
          flex: 1,
          gap: 2
        }}
      >
        <div
          style={{
            fontSize: density === 'compact' ? 13 : 14,
            fontWeight: 500,
            lineHeight: 1.3,
            color: 'inherit',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {title}
        </div>
        {subtitle && density === 'comfortable' && (
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.3,
              color: 'var(--color-fg-tertiary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {trailing && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
            color: 'var(--color-fg-tertiary)'
          }}
        >
          {trailing}
        </span>
      )}
    </div>
  )
})
