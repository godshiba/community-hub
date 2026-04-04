import { cn } from '@/lib/utils'

interface EmptyStateAction {
  label: string
  onClick: () => void
}

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: EmptyStateAction
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 text-center',
        className
      )}
    >
      {Icon && (
        <div className="size-12 rounded-xl bg-white/[0.05] border border-glass-border flex items-center justify-center">
          <Icon className="size-6 text-text-muted" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        {description && (
          <p className="text-xs text-text-muted mt-1 max-w-xs">{description}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="px-3 py-1.5 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors mt-1"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
