import { ContextMenu as RadixContextMenu } from 'radix-ui'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'
import { KeyCap } from './KeyCap'

export interface ContextMenuItem {
  type?: 'item'
  id: string
  label: ReactNode
  icon?: ReactNode
  shortcut?: ReadonlyArray<string>
  destructive?: boolean
  disabled?: boolean
  onSelect: () => void
}

export interface ContextMenuSeparator {
  type: 'separator'
  id: string
}

export interface ContextMenuLabel {
  type: 'label'
  id: string
  label: ReactNode
}

export interface ContextMenuSubmenu {
  type: 'submenu'
  id: string
  label: ReactNode
  icon?: ReactNode
  disabled?: boolean
  items: ReadonlyArray<ContextMenuNode>
}

export type ContextMenuNode =
  | ContextMenuItem
  | ContextMenuSeparator
  | ContextMenuLabel
  | ContextMenuSubmenu

export interface ContextMenuProps {
  trigger: ReactNode
  items: ReadonlyArray<ContextMenuNode>
  disabled?: boolean
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

function renderNode(node: ContextMenuNode): React.ReactElement {
  if (node.type === 'separator') {
    return <RadixContextMenu.Separator key={node.id} style={SEPARATOR_STYLE} />
  }
  if (node.type === 'label') {
    return (
      <RadixContextMenu.Label key={node.id} style={LABEL_STYLE}>
        {node.label}
      </RadixContextMenu.Label>
    )
  }
  if (node.type === 'submenu') {
    return (
      <RadixContextMenu.Sub key={node.id}>
        <RadixContextMenu.SubTrigger
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
        </RadixContextMenu.SubTrigger>
        <RadixContextMenu.Portal>
          <RadixContextMenu.SubContent
            sideOffset={6}
            className="ui-native-menu-content"
            style={CONTENT_STYLE}
          >
            {node.items.map(renderNode)}
          </RadixContextMenu.SubContent>
        </RadixContextMenu.Portal>
      </RadixContextMenu.Sub>
    )
  }
  const color = node.destructive ? 'var(--color-error)' : undefined
  return (
    <RadixContextMenu.Item
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
    </RadixContextMenu.Item>
  )
}

export function ContextMenu({
  trigger,
  items,
  disabled = false,
  className,
  contentStyle
}: ContextMenuProps): React.ReactElement {
  return (
    <RadixContextMenu.Root>
      <RadixContextMenu.Trigger asChild disabled={disabled}>
        {trigger}
      </RadixContextMenu.Trigger>
      <RadixContextMenu.Portal>
        <RadixContextMenu.Content
          className={cn('ui-native-menu-content', className)}
          style={{ ...CONTENT_STYLE, ...contentStyle }}
        >
          {items.map(renderNode)}
        </RadixContextMenu.Content>
      </RadixContextMenu.Portal>
    </RadixContextMenu.Root>
  )
}
