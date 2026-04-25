import { useSyncExternalStore, useContext } from 'react'
import { CursorClick } from '@phosphor-icons/react'
import { usePanelStore } from '@/stores/panel.store'
import { useShellStore } from '@/stores/shell.store'
import { ToolbarContext } from './toolbarContext'

const INSPECTOR_WIDTH = 340

export function Inspector(): React.ReactElement | null {
  const toolbarStore = useContext(ToolbarContext)!
  const config = useSyncExternalStore(
    toolbarStore.subscribe,
    toolbarStore.getConfig,
    toolbarStore.getConfig
  )

  const activePanel = usePanelStore((s) => s.activePanel)
  const inspectorOpenByPanel = useShellStore((s) => s.inspectorOpenByPanel)

  const enabled = config.inspector?.enabled ?? false
  const isOpen = (inspectorOpenByPanel[activePanel] ?? false) && enabled

  if (!isOpen) return null

  const renderEmpty = config.inspector?.renderEmpty

  return (
    <div
      className="flex flex-col shrink-0 border-l border-[var(--color-divider-strong)] overflow-hidden"
      style={{
        width: INSPECTOR_WIDTH,
        background: 'rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
      }}
      aria-label="Inspector"
    >
      {/* Inspector header */}
      <div className="h-[52px] flex items-center px-4 border-b border-[var(--color-divider)] shrink-0">
        <span className="text-[13px] font-semibold text-[var(--color-fg-secondary)] uppercase tracking-wider">
          Inspector
        </span>
      </div>

      {/* Inspector content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {renderEmpty ? (
          renderEmpty()
        ) : (
          <DefaultEmpty />
        )}
      </div>
    </div>
  )
}

function DefaultEmpty(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-6 py-12 text-center">
      <CursorClick
        size={28}
        weight="regular"
        className="text-[var(--color-fg-tertiary)]"
      />
      <p className="text-[15px] font-semibold text-[var(--color-fg-secondary)]">
        Nothing selected
      </p>
      <p className="text-[13px] text-[var(--color-fg-tertiary)] leading-relaxed">
        Select an item from the list to view details here.
      </p>
    </div>
  )
}
