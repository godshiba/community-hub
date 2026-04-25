import { Sheet } from '@/components/ui-native/Sheet'

interface ShortcutEntry {
  label: string
  shortcut: string
}

interface ShortcutGroup {
  title: string
  entries: ShortcutEntry[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    entries: [
      { label: 'Command palette',          shortcut: '⌘K' },
      { label: 'Keyboard shortcuts',       shortcut: '⌘/' },
      { label: 'Dashboard',                shortcut: '⌘1' },
      { label: 'Moderation',               shortcut: '⌘2' },
      { label: 'Events',                   shortcut: '⌘3' },
      { label: 'Scheduler',                shortcut: '⌘4' },
      { label: 'Agent Terminal',           shortcut: '⌘5' },
      { label: 'Reports',                  shortcut: '⌘6' },
      { label: 'Settings',                 shortcut: '⌘7' },
      { label: 'Open Preferences',         shortcut: '⌘,' }
    ]
  },
  {
    title: 'Window',
    entries: [
      { label: 'Toggle sidebar',           shortcut: '⌘B' },
      { label: 'Toggle inspector',         shortcut: '⌥⌘I' },
      { label: 'Focus search',             shortcut: '⌘F' },
      { label: 'Close window',             shortcut: '⌘W' },
      { label: 'Minimize',                 shortcut: '⌘M' },
      { label: 'Toggle fullscreen',        shortcut: '⌃⌘F' },
      { label: 'Quit',                     shortcut: '⌘Q' }
    ]
  },
  {
    title: 'Actions',
    entries: [
      { label: 'New post',                 shortcut: '⌘N' },
      { label: 'New event',                shortcut: '⇧⌘N' },
      { label: 'Generate report',          shortcut: '⌘R' },
      { label: 'Sync now',                 shortcut: '⌥⌘S' },
      { label: 'Save (Settings forms)',    shortcut: '⌘S' }
    ]
  },
  {
    title: 'Lists',
    entries: [
      { label: 'Navigate list',            shortcut: '↑ ↓' },
      { label: 'Open detail',              shortcut: '⌘↵' },
      { label: 'Select all',               shortcut: '⌘A' },
      { label: 'Deselect all',             shortcut: '⇧⌘A' },
      { label: 'Delete selected',          shortcut: '⌫' },
      { label: 'Open context menu',        shortcut: '⌃↵' },
      { label: 'Dismiss / clear',          shortcut: 'Esc' }
    ]
  }
]

const LEFT_GROUPS = SHORTCUT_GROUPS.slice(0, 2)
const RIGHT_GROUPS = SHORTCUT_GROUPS.slice(2)

interface KeyboardShortcutsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsSheet({ open, onOpenChange }: KeyboardShortcutsSheetProps): React.ReactElement {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Keyboard Shortcuts"
      width={680}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
        <div>{LEFT_GROUPS.map((g) => <ShortcutGroupBlock key={g.title} group={g} />)}</div>
        <div>{RIGHT_GROUPS.map((g) => <ShortcutGroupBlock key={g.title} group={g} />)}</div>
      </div>
    </Sheet>
  )
}

function ShortcutGroupBlock({ group }: { group: ShortcutGroup }): React.ReactElement {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        margin: '0 0 8px',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--color-fg-tertiary)',
        fontFamily: 'var(--font-sans)'
      }}>
        {group.title}
      </p>
      <div style={{
        background: 'var(--color-surface-plain)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--color-divider)'
      }}>
        {group.entries.map((entry, i) => (
          <div
            key={entry.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 12px',
              borderBottom: i < group.entries.length - 1 ? '1px solid var(--color-divider)' : 'none'
            }}
          >
            <span style={{
              fontSize: 13,
              color: 'var(--color-fg-secondary)',
              fontFamily: 'var(--font-sans)'
            }}>
              {entry.label}
            </span>
            <kbd style={{
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-fg-tertiary)',
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-divider-strong)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 6px',
              letterSpacing: '0.02em'
            }}>
              {entry.shortcut}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  )
}
