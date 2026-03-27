export function StatusBar(): React.ReactElement {
  return (
    <div className="h-6 bg-glass-surface border-t border-glass-border flex items-center justify-between px-4 text-[11px] shrink-0">
      <div className="flex items-center gap-3">
        <StatusDot color="text-text-muted" label="Discord" />
        <StatusDot color="text-text-muted" label="Telegram" />
      </div>

      <div className="text-text-muted">
        Agent: <span className="text-text-secondary">Disabled</span>
      </div>

      <div className="text-text-muted">
        —
      </div>
    </div>
  )
}

interface StatusDotProps {
  color: string
  label: string
}

function StatusDot({ color, label }: StatusDotProps): React.ReactElement {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`size-1.5 rounded-full ${color} bg-current`} />
      <span className="text-text-muted">{label}</span>
    </div>
  )
}
