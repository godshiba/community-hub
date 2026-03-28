export function TitleBar(): React.ReactElement {
  return (
    <div
      className="h-8 bg-glass-surface border-b border-glass-border flex items-center select-none shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 pl-20">
        <span className="text-xs font-medium text-text-secondary tracking-wide">
          Community Hub
        </span>
      </div>
    </div>
  )
}
