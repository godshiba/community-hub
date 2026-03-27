import { Minus, Square, X } from 'lucide-react'

export function TitleBar(): React.ReactElement {
  const handleMinimize = (): void => {
    window.api.invoke('window:minimize')
  }

  const handleMaximize = (): void => {
    window.api.invoke('window:maximize')
  }

  const handleClose = (): void => {
    window.api.invoke('window:close')
  }

  return (
    <div className="h-8 bg-glass-surface border-b border-glass-border flex items-center justify-between select-none shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 pl-4">
        <span className="text-xs font-medium text-text-secondary tracking-wide">
          Community Hub
        </span>
      </div>

      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="h-full px-3 hover:bg-white/[0.06] transition-colors duration-150"
          aria-label="Minimize"
        >
          <Minus className="size-3.5 text-text-secondary" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-3 hover:bg-white/[0.06] transition-colors duration-150"
          aria-label="Maximize"
        >
          <Square className="size-3 text-text-secondary" />
        </button>
        <button
          onClick={handleClose}
          className="h-full px-3 hover:bg-error/80 transition-colors duration-150"
          aria-label="Close"
        >
          <X className="size-3.5 text-text-secondary" />
        </button>
      </div>
    </div>
  )
}
