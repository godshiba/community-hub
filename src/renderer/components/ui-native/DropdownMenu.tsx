import { DropdownMenu as RadixDropdownMenu } from 'radix-ui'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'
import { KeyCap } from './KeyCap'

export interface DropdownMenuItem {
  type?: 'item'
  id: string
  label: ReactNode
  icon?: ReactNode
  shortcut?: ReadonlyArray<string>
  destructive?: boolean
  disabled?: boolean
  onSelect: () => void
}

export interface DropdownMenuSeparator {
  type: 'separator'
  id: string
}

export interface DropdownMenuLabel {
  type: 'label'
  id: string
  label: ReactNode
}

export interface DropdownMenuSubmenu {
  type: 'submenu'
  id: string
  label: ReactNode
  icon?: ReactNode
  disabled?: boolean
  items: ReadonlyArray<DropdownMenuNode>
}

export type DropdownMenuNode =
  | DropdownMenuItem
  | DropdownMenuSeparator
  | DropdownMenuLabel
  | DropdownMenuSubmenu

export type DropdownMenuSide = 'top' | 'right' | 'bottom' | 'left'
export type DropdownMenuAlign = 'start' | 'center' | 'end'

export interface DropdownMenuProps {
  trigger: ReactNode
  items: ReadonlyArray<DropdownMenuNode>
  side?: DropdownMenuSide
  align?: DropdownMenuAlign
  sideOffset?: number
  alignOffset?: number
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  contentStyle?: CSSProperties
}

const CONTENT_STYLE: CSSProperties = {
  minWidth: 180,
  padding: 4,
  background: 'var(--color-surface-card-raised)',
  border: '1px solid var(--color-divider-strong)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-popover)',
  color: 'var(--color-fg-primary)',
  zIndex: 'var(--z-popover)' as unknown as number,
  outline: 'none',
  transformOrigin: 'var(--radix-dropdown-menu-content-transform-origin)',
  animation: 'modal-in var(--duration-fast) var(--ease-standard) both'
}

const ITEM_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  paddingInline: 8,
  paddingBlock: 5,
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  lineHeight: 1.3,
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  outline: 'none',
  userSelect: 'none'
}

const ITEM_ICON_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  color: 'var(--color-fg-tertiary)'
}

const LABEL_STYLE: CSSProperties = {
  paddingInline: 8,
  paddingBlock: 4,
  fontFamily: 'var(--font-sans)',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--color-fg-tertiary)'
}

const SEPARATOR_STYLE: CSSProperties = {
  height: 1,
  background: 'var(--color-divider)',
  marginBlock: 4,
  marginInline: 4
}

function renderNode(node: DropdownMenuNode): React.ReactElement {
  if (node.type === 'separator') {
    return <RadixDropdownMenu.Separator key={node.id} style={SEPARATOR_STYLE} />
  }
  if (node.type === 'label') {
    return (
      <RadixDropdownMenu.Label key={node.id} style={LABEL_STYLE}>
        {node.label}
      </RadixDropdownMenu.Label>
    )
  }
  if (node.type === 'submenu') {
    return (
      <RadixDropdownMenu.Sub key={node.id}>
        <RadixDropdownMenu.SubTrigger
          disabled={node.disabled}
          className="ui-native-menu-item"
          style={{ ...ITEM_STYLE, justifyContent: 'space-between' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {node.icon && <span style={ITEM_ICON_STYLE}>{node.icon}</span>}
            <span>{node.label}</span>
          </span>
          <span aria-hidden style={{ color: 'var(--color-fg-tertiary)', fontSize: 11 }}>
            ▶
          </span>
        </RadixDropdownMenu.SubTrigger>
        <RadixDropdownMenu.Portal>
          <RadixDropdownMenu.SubContent
            sideOffset={6}
            className="ui-native-menu-content"
            style={CONTENT_STYLE}
          >
            {node.items.map(renderNode)}
          </RadixDropdownMenu.SubContent>
        </RadixDropdownMenu.Portal>
      </RadixDropdownMenu.Sub>
    )
  }
  const color = node.destructive ? 'var(--color-error)' : undefined
  return (
    <RadixDropdownMenu.Item
      key={node.id}
      disabled={node.disabled}
      onSelect={(e) => {
        e.preventDefault()
        node.onSelect()
      }}
      className="ui-native-menu-item"
      style={{ ...ITEM_STYLE, color, justifyContent: 'space-between' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {node.icon && <span style={{ ...ITEM_ICON_STYLE, color }}>{node.icon}</span>}
        <span>{node.label}</span>
      </span>
      {node.shortcut && node.shortcut.length > 0 && (
        <KeyCap keys={node.shortcut} size="sm" />
      )}
    </RadixDropdownMenu.Item>
  )
}

export function DropdownMenu({
  trigger,
  items,
  side = 'bottom',
  align = 'start',
  sideOffset = 6,
  alignOffset = 0,
  open,
  defaultOpen,
  onOpenChange,
  className,
  contentStyle
}: DropdownMenuProps): React.ReactElement {
  return (
    <RadixDropdownMenu.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <RadixDropdownMenu.Trigger asChild>{trigger}</RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          className={cn('ui-native-menu-content', className)}
          style={{ ...CONTENT_STYLE, ...contentStyle }}
        >
          {items.map(renderNode)}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  )
}
