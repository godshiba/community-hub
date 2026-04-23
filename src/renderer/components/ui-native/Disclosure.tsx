import { Collapsible } from 'radix-ui'
import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useState } from 'react'
import { cn } from '@renderer/lib/utils'

export interface DisclosureProps {
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  density?: 'compact' | 'comfortable'
  className?: string
  contentStyle?: CSSProperties
  trailing?: ReactNode
}

function Chevron({ open }: { open: boolean }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 12 12"
      width="12"
      height="12"
      aria-hidden
      style={{
        display: 'block',
        color: 'var(--color-fg-tertiary)',
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform var(--duration-fast) var(--ease-standard)'
      }}
    >
      <path
        d="M4 2 L8 6 L4 10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Disclosure({
  title,
  subtitle,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  density = 'comfortable',
  className,
  contentStyle,
  trailing
}: DisclosureProps): React.ReactElement {
  const isControlled = open !== undefined
  const [internalOpen, setInternalOpen] = useState<boolean>(defaultOpen)
  const isOpen = isControlled ? open : internalOpen

  const handleOpenChange = useCallback(
    (next: boolean): void => {
      if (!isControlled) setInternalOpen(next)
      if (onOpenChange) onOpenChange(next)
    },
    [isControlled, onOpenChange]
  )

  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      disabled={disabled}
      className={cn('ui-native-disclosure', className)}
    >
      <Collapsible.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="ui-native-disclosure-trigger"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingBlock: density === 'compact' ? 6 : 10,
            paddingInline: 10,
            background: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-fg-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: density === 'compact' ? 13 : 14,
            fontWeight: 600,
            lineHeight: 1.3,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.38 : 1,
            outline: 'none',
            userSelect: 'none',
            textAlign: 'left'
          }}
        >
          <Chevron open={isOpen} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block' }}>{title}</span>
            {subtitle && (
              <span
                style={{
                  display: 'block',
                  marginTop: 2,
                  fontSize: 12,
                  fontWeight: 400,
                  color: 'var(--color-fg-tertiary)'
                }}
              >
                {subtitle}
              </span>
            )}
          </span>
          {trailing && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--color-fg-tertiary)'
              }}
            >
              {trailing}
            </span>
          )}
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content
        style={{
          overflow: 'hidden',
          ...contentStyle
        }}
      >
        <div
          style={{
            paddingBlock: density === 'compact' ? 4 : 8,
            paddingInline: 10
          }}
        >
          {children}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
