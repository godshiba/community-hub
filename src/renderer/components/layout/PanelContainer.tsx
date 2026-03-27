import { useCallback, useRef } from 'react'
import { usePanelStore } from '@/stores/panel.store'
import { PANEL_REGISTRY } from '@/panels/registry'

export function PanelContainer(): React.ReactElement {
  const { activePanel, secondaryPanel, splitRatio, setSplitRatio } = usePanelStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  const PrimaryPanel = PANEL_REGISTRY[activePanel]
  const SecondaryPanel = secondaryPanel ? PANEL_REGISTRY[secondaryPanel] : null

  const handleMouseDown = useCallback(() => {
    draggingRef.current = true

    const handleMouseMove = (e: MouseEvent): void => {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      setSplitRatio(ratio)
    }

    const handleMouseUp = (): void => {
      draggingRef.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [setSplitRatio])

  if (!SecondaryPanel) {
    return (
      <div className="flex-1 p-2 overflow-hidden">
        <PrimaryPanel />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 flex p-2 gap-0 overflow-hidden">
      <div style={{ width: `${splitRatio * 100}%` }} className="overflow-hidden">
        <PrimaryPanel />
      </div>

      <div
        className="w-1 cursor-col-resize hover:bg-accent/30 transition-colors duration-150 shrink-0 mx-0.5"
        onMouseDown={handleMouseDown}
      />

      <div style={{ width: `${(1 - splitRatio) * 100}%` }} className="overflow-hidden">
        <SecondaryPanel />
      </div>
    </div>
  )
}
