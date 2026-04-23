import { Tooltip as RadixTooltip } from 'radix-ui'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'
import { KeyCap } from './KeyCap'

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left'
export type TooltipAlign = 'start' | 'center' | 'end'

export interface TooltipProps {
  label: ReactNode
  shortcut?: ReadonlyArray<string>
  children: ReactNode
  side?: TooltipSide
  align?: TooltipAlign
  sideOffset?: number
  delayMs?: number
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  contentStyle?: CSSProperties
}

export interface TooltipProviderProps {
  children: ReactNode
  delayMs?: number
  skipDelayMs?: number
}

export function TooltipProvider({
  children,
  delayMs = 500,
  skipDelayMs = 300
}: TooltipProviderProps): React.ReactElement {
  return (
    <RadixTooltip.Provider delayDuration={delayMs} skipDelayDuration={skipDelayMs}>
      {children}
    </RadixTooltip.Provider>
  )
}

export function Tooltip({
  label,
  shortcut,
  children,
  side = 'top',
  align = 'center',
  sideOffset = 6,
  delayMs,
  open,
  defaultOpen,
  onOpenChange,
  className,
  contentStyle
}: TooltipProps): React.ReactElement {
  return (
    <RadixTooltip.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      delayDuration={delayMs}
    >
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={cn('ui-native-tooltip-content', className)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            paddingInline: 8,
            paddingBlock: 4,
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            lineHeight: 1.3,
            color: 'var(--color-fg-primary)',
            background: 'var(--color-surface-card-elevated)',
            border: '1px solid var(--color-divider-strong)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-popover)',
            zIndex: 'var(--z-popover)' as unknown as number,
            userSelect: 'none',
            transformOrigin: 'var(--radix-tooltip-content-transform-origin)',
            animation: 'modal-in var(--duration-fast) var(--ease-standard) both',
            ...contentStyle
          }}
        >
          <span>{label}</span>
          {shortcut && shortcut.length > 0 && <KeyCap keys={shortcut} size="sm" />}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
