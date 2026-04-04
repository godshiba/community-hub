import { cn } from '@/lib/utils'

type Elevation = 'surface' | 'raised' | 'overlay'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation
  gradient?: boolean
  interactive?: boolean
}

const elevationClass: Record<Elevation, string> = {
  surface: 'bg-glass-surface',
  raised: 'bg-glass-raised',
  overlay: 'bg-glass-overlay'
}

export function GlassCard({
  elevation = 'raised',
  gradient = false,
  interactive = false,
  className,
  children,
  ...props
}: GlassCardProps): React.ReactElement {
  return (
    <div
      className={cn(
        elevationClass[elevation],
        'border-glass shadow-glass rounded-[var(--radius-card)]',
        gradient && 'ring-1 ring-inset ring-accent/20',
        interactive && 'cursor-pointer transition-transform duration-150 hover:-translate-y-px hover:shadow-[0_6px_32px_rgba(0,0,0,0.4)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
