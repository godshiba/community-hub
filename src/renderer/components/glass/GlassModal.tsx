import { cn } from '@/lib/utils'

interface GlassModalProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean
  onClose: () => void
}

export function GlassModal({
  open,
  onClose,
  className,
  children,
  ...props
}: GlassModalProps): React.ReactElement | null {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />
      <div
        className={cn(
          'bg-glass-overlay border-glass shadow-glass rounded-[var(--radius-panel)]',
          'relative z-10 max-w-lg w-full mx-4 p-6',
          'animate-modal-in',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}
