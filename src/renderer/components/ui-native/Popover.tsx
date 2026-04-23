import { Popover as RadixPopover } from 'radix-ui'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'

export type PopoverSide = 'top' | 'right' | 'bottom' | 'left'
export type PopoverAlign = 'start' | 'center' | 'end'

export interface PopoverProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  trigger: ReactNode
  children: ReactNode
  side?: PopoverSide
  align?: PopoverAlign
  sideOffset?: number
  alignOffset?: number
  modal?: boolean
  padding?: number
  minWidth?: number | string
  maxWidth?: number | string
  className?: string
  contentStyle?: CSSProperties
  ariaLabel?: string
}

export function Popover({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  children,
  side = 'bottom',
  align = 'start',
  sideOffset = 6,
  alignOffset = 0,
  modal = false,
  padding = 8,
  minWidth,
  maxWidth,
  className,
  contentStyle,
  ariaLabel
}: PopoverProps): React.ReactElement {
  return (
    <RadixPopover.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      modal={modal}
    >
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          aria-label={ariaLabel}
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          className={cn('ui-native-popover-content', className)}
          style={{
            minWidth,
            maxWidth,
            padding,
            background: 'var(--color-surface-card-raised)',
            border: '1px solid var(--color-divider-strong)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-popover)',
            color: 'var(--color-fg-primary)',
            zIndex: 'var(--z-popover)' as unknown as number,
            outline: 'none',
            transformOrigin: 'var(--radix-popover-content-transform-origin)',
            animation: 'modal-in var(--duration-fast) var(--ease-standard) both',
            ...contentStyle
          }}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}

export const PopoverClose = RadixPopover.Close
export const PopoverAnchor = RadixPopover.Anchor
