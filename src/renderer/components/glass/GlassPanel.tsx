import { cn } from '@/lib/utils'

type Elevation = 'surface' | 'raised' | 'overlay'

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation
}

const elevationClass: Record<Elevation, string> = {
  surface: 'bg-glass-surface',
  raised: 'bg-glass-raised',
  overlay: 'bg-glass-overlay'
}

export function GlassPanel({
  elevation = 'raised',
  className,
  children,
  ...props
}: GlassPanelProps): React.ReactElement {
  return (
    <div
      className={cn(
        elevationClass[elevation],
        'border-glass shadow-glass rounded-[var(--radius-panel)] h-full overflow-auto',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
