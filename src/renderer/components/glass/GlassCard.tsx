import { cn } from '@/lib/utils'

type Elevation = 'surface' | 'raised' | 'overlay'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation
}

const elevationClass: Record<Elevation, string> = {
  surface: 'bg-glass-surface',
  raised: 'bg-glass-raised',
  overlay: 'bg-glass-overlay'
}

export function GlassCard({
  elevation = 'raised',
  className,
  children,
  ...props
}: GlassCardProps): React.ReactElement {
  return (
    <div
      className={cn(
        elevationClass[elevation],
        'border-glass shadow-glass rounded-[var(--radius-card)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
