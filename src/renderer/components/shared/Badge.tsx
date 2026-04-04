import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'muted'
  | 'platform-discord'
  | 'platform-telegram'

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-success/15 text-success border-success/25',
  warning: 'bg-warning/15 text-warning border-warning/25',
  error: 'bg-error/15 text-error border-error/25',
  info: 'bg-accent/15 text-accent border-accent/25',
  muted: 'bg-white/[0.06] text-text-muted border-white/[0.08]',
  'platform-discord': 'bg-discord/15 text-discord border-discord/25',
  'platform-telegram': 'bg-telegram/15 text-telegram border-telegram/25'
}

export function Badge({
  variant = 'muted',
  className,
  children
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-badge)]',
        'text-xs font-medium border',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
