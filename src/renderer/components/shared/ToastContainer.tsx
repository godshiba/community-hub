import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore, type Toast, type ToastVariant } from '@/stores/toast.store'
import { cn } from '@/lib/utils'

const ICONS: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
}

const STYLES: Record<ToastVariant, string> = {
  success: 'border-success/30 text-success',
  error: 'border-error/30 text-error',
  warning: 'border-warning/30 text-warning',
  info: 'border-accent/30 text-accent'
}

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps): React.ReactElement {
  const Icon = ICONS[toast.variant]

  useEffect(() => {
    const duration = toast.variant === 'error' ? 6000 : 4000
    const timer = setTimeout(() => onDismiss(toast.id), duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.variant, onDismiss])

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-[var(--radius-card)]',
        'bg-glass-overlay border shadow-glass',
        'animate-toast-in',
        STYLES[toast.variant]
      )}
      role="alert"
    >
      <Icon className="size-4 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary leading-snug">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-text-secondary mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-text-muted hover:text-text-secondary transition-colors"
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

export function ToastContainer(): React.ReactElement {
  const { toasts, dismiss } = useToastStore()

  if (toasts.length === 0) return <></>

  return (
    <div className="fixed bottom-8 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  )
}
