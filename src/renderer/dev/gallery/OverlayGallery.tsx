import { useState } from 'react'
import { Bell, Check, Gear, Trash } from '@phosphor-icons/react'
import { Button } from '@renderer/components/ui-native/Button'
import { Sheet } from '@renderer/components/ui-native/Sheet'
import { Alert } from '@renderer/components/ui-native/Alert'
import { Popover } from '@renderer/components/ui-native/Popover'
import { Tooltip, TooltipProvider } from '@renderer/components/ui-native/Tooltip'
import { ContextMenu } from '@renderer/components/ui-native/ContextMenu'
import { DropdownMenu } from '@renderer/components/ui-native/DropdownMenu'
import { ListRow } from '@renderer/components/ui-native/ListRow'
import { Disclosure } from '@renderer/components/ui-native/Disclosure'
import { EmptyState } from '@renderer/components/ui-native/EmptyState'
import { Avatar } from '@renderer/components/ui-native/Avatar'
import { Pill } from '@renderer/components/ui-native/Pill'
import { GallerySection, GalleryRow } from './GallerySection'

const MENU_ITEMS = [
  {
    type: 'label' as const,
    id: 'actions',
    label: 'Actions'
  },
  {
    id: 'rename',
    label: 'Rename',
    icon: <Gear size={14} />,
    shortcut: ['cmd', 'R'] as const,
    onSelect: () => undefined
  },
  {
    id: 'notify',
    label: 'Notify',
    icon: <Bell size={14} />,
    onSelect: () => undefined
  },
  { type: 'separator' as const, id: 'sep1' },
  {
    type: 'submenu' as const,
    id: 'more',
    label: 'More…',
    items: [
      { id: 'dup', label: 'Duplicate', onSelect: () => undefined },
      { id: 'copy-id', label: 'Copy ID', onSelect: () => undefined }
    ]
  },
  { type: 'separator' as const, id: 'sep2' },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash size={14} />,
    shortcut: ['delete'] as const,
    destructive: true,
    onSelect: () => undefined
  }
]

export function OverlayGallery(): React.ReactElement {
  const [sheetOpen, setSheetOpen] = useState<boolean>(false)
  const [alertOpen, setAlertOpen] = useState<boolean>(false)
  const [selected, setSelected] = useState<string>('row-1')

  return (
    <TooltipProvider>
      <GallerySection id="sheet" title="Sheet" subtitle="Modal container with header/footer slots">
        <GalleryRow label="Open">
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>
            Open sheet
          </Button>
        </GalleryRow>
        <Sheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="Example sheet"
          description="Scale + fade entry, backdrop blur, centered."
          width="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setSheetOpen(false)}>
                Done
              </Button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-fg-secondary)' }}>
            Sheets are used for complex input flows that would not fit a popover
            — sign-in, create post, filter builder, keyboard shortcut cheatsheet.
          </p>
        </Sheet>
      </GallerySection>

      <GallerySection id="alert" title="Alert" subtitle="NSAlert-style confirmation">
        <GalleryRow label="Destructive">
          <Button variant="destructive" onClick={() => setAlertOpen(true)}>
            Delete member
          </Button>
        </GalleryRow>
        <Alert
          open={alertOpen}
          onOpenChange={setAlertOpen}
          tone="destructive"
          title="Delete member?"
          description="This will remove the member from your community and revoke any scheduled actions. This can't be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => setAlertOpen(false)}
        />
      </GallerySection>

      <GallerySection id="popover" title="Popover">
        <GalleryRow label="Bottom start">
          <Popover
            trigger={<Button variant="secondary">Open popover</Button>}
            minWidth={240}
            padding={12}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                fontSize: 13,
                color: 'var(--color-fg-primary)'
              }}
            >
              <strong>Popover contents</strong>
              <span style={{ color: 'var(--color-fg-tertiary)' }}>
                Contextual UI anchored to a trigger.
              </span>
            </div>
          </Popover>
        </GalleryRow>
      </GallerySection>

      <GallerySection id="tooltip" title="Tooltip" subtitle="500ms delay, optional KeyCap">
        <GalleryRow label="Plain">
          <Tooltip label="Simple tooltip">
            <Button variant="icon" aria-label="Info">
              ?
            </Button>
          </Tooltip>
        </GalleryRow>
        <GalleryRow label="With shortcut">
          <Tooltip label="Open command palette" shortcut={['cmd', 'K']}>
            <Button variant="secondary">⌘K</Button>
          </Tooltip>
        </GalleryRow>
      </GallerySection>

      <GallerySection id="contextmenu" title="ContextMenu" subtitle="Right-click a row">
        <GalleryRow label="Right-click target">
          <ContextMenu
            items={MENU_ITEMS}
            trigger={
              <div
                style={{
                  padding: 12,
                  background: 'var(--color-surface-card)',
                  border: '1px solid var(--color-divider)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  color: 'var(--color-fg-secondary)',
                  cursor: 'context-menu',
                  width: 240
                }}
              >
                Right-click inside this box
              </div>
            }
          />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="dropdownmenu" title="DropdownMenu">
        <GalleryRow label="Click to open">
          <DropdownMenu
            items={MENU_ITEMS}
            trigger={<Button variant="secondary">Row actions</Button>}
          />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="listrow" title="ListRow" subtitle="Unified list row">
        <div
          role="listbox"
          style={{
            width: 420,
            padding: 4,
            background: 'var(--color-surface-card)',
            border: '1px solid var(--color-divider)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <ListRow
            leading={<Avatar name="Alice Liddell" size="sm" />}
            title="Alice Liddell"
            subtitle="alice@example.com"
            trailing={<Pill variant="discord">Discord</Pill>}
            selected={selected === 'row-1'}
            onSelect={() => setSelected('row-1')}
          />
          <ListRow
            leading={<Avatar name="Bob Ross" size="sm" />}
            title="Bob Ross"
            subtitle="painter since yesterday"
            trailing={<Pill variant="telegram">Telegram</Pill>}
            selected={selected === 'row-2'}
            onSelect={() => setSelected('row-2')}
          />
          <ListRow
            leading={<Check size={16} />}
            title="Compact row"
            density="compact"
            trailing={<span style={{ fontSize: 12 }}>12m</span>}
            selected={selected === 'row-3'}
            onSelect={() => setSelected('row-3')}
          />
          <ListRow title="Disabled row" disabled />
          <ListRow title="Danger row" danger trailing={<Trash size={14} />} />
        </div>
      </GallerySection>

      <GallerySection id="disclosure" title="Disclosure">
        <div style={{ width: 420 }}>
          <Disclosure title="Advanced options" subtitle="Tap to expand" defaultOpen>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-fg-secondary)' }}>
              Body content only mounts when open (via radix-ui Collapsible). Chevron
              rotates 0 → 90 degrees.
            </p>
          </Disclosure>
          <Disclosure title="Closed by default">
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-fg-secondary)' }}>
              Secondary content.
            </p>
          </Disclosure>
        </div>
      </GallerySection>

      <GallerySection id="emptystate" title="EmptyState">
        <GalleryRow label="Default">
          <EmptyState
            icon={<Bell size={40} />}
            title="No notifications yet"
            subtitle="You'll see activity here as your community grows."
            action={<Button variant="primary">Invite members</Button>}
          />
        </GalleryRow>
        <GalleryRow label="Error">
          <EmptyState
            variant="error"
            icon={<Trash size={40} />}
            title="Failed to load"
            subtitle="The server returned an error. Try again in a moment."
            action={<Button variant="secondary">Retry</Button>}
          />
        </GalleryRow>
      </GallerySection>
    </TooltipProvider>
  )
}
