import { AlertDialog } from 'radix-ui'
import type { ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'
import { Button, type ButtonVariant } from './Button'

export type AlertTone = 'info' | 'warning' | 'destructive'

export interface AlertProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  tone?: AlertTone
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  isConfirming?: boolean
  className?: string
}

const CONFIRM_VARIANT: Record<AlertTone, ButtonVariant> = {
  info: 'primary',
  warning: 'primary',
  destructive: 'destructive'
}

export function Alert({
  open,
  onOpenChange,
  title,
  description,
  tone = 'info',
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isConfirming = false,
  className
}: AlertProps): React.ReactElement {
  const handleConfirm = async (): Promise<void> => {
    if (onConfirm) await onConfirm()
  }

  const handleCancel = (): void => {
    if (onCancel) onCancel()
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className="ui-native-alert-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.32)',
            backdropFilter: 'blur(2px)',
            zIndex: 'var(--z-modal)' as unknown as number,
            animation: 'backdrop-in var(--duration-fast) var(--ease-standard) both'
          }}
        />
        <AlertDialog.Content
          className={cn('ui-native-alert-content', className)}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            translate: '-50% -50%',
            width: 360,
            maxWidth: 'calc(100vw - 48px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: '20px 20px 16px',
            background: 'var(--color-surface-card-raised)',
            border: '1px solid var(--color-divider-strong)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-modal)',
            color: 'var(--color-fg-primary)',
            zIndex: 'var(--z-modal)' as unknown as number,
            outline: 'none',
            animation: 'modal-in var(--duration-standard) var(--ease-standard) both',
            textAlign: 'center'
          }}
        >
          <AlertDialog.Title
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.3,
              color: 'var(--color-fg-primary)'
            }}
          >
            {title}
          </AlertDialog.Title>
          {description && (
            <AlertDialog.Description
              style={{
                margin: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                lineHeight: 1.45,
                color: 'var(--color-fg-secondary)'
              }}
            >
              {description}
            </AlertDialog.Description>
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row-reverse',
              gap: 8,
              marginTop: 8
            }}
          >
            <AlertDialog.Action asChild>
              <Button
                variant={CONFIRM_VARIANT[tone]}
                size="md"
                isLoading={isConfirming}
                onClick={handleConfirm}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" size="md" onClick={handleCancel} disabled={isConfirming}>
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
