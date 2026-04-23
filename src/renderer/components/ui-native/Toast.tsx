import { Toast as RadixToast } from 'radix-ui'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface ToastProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant?: ToastVariant
  title: ReactNode
  description?: ReactNode
  action?: {
    label: string
    onClick: () => void
    altText: string
  }
  durationMs?: number
  dismissible?: boolean
  className?: string
  style?: CSSProperties
}

export interface ToastProviderProps {
  children: ReactNode
  swipeDirection?: 'right' | 'left' | 'up' | 'down'
  swipeThreshold?: number
  duration?: number
}

const VARIANT_ACCENT: Record<ToastVariant, string> = {
  info: 'var(--color-accent)',
  success: 'var(--color-success, #34c759)',
  warning: 'var(--color-warning, #ff9500)',
  error: 'var(--color-error)'
}

export function ToastProvider({
  children,
  swipeDirection = 'right',
  swipeThreshold = 50,
  duration = 4000
}: ToastProviderProps): React.ReactElement {
  return (
    <RadixToast.Provider
      swipeDirection={swipeDirection}
      swipeThreshold={swipeThreshold}
      duration={duration}
    >
      {children}
    </RadixToast.Provider>
  )
}

export function ToastViewport({
  className,
  style
}: {
  className?: string
  style?: CSSProperties
}): React.ReactElement {
  return (
    <RadixToast.Viewport
      className={cn('ui-native-toast-viewport', className)}
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 360,
        maxWidth: 'calc(100vw - 32px)',
        listStyle: 'none',
        margin: 0,
        padding: 0,
        zIndex: 80,
        outline: 'none',
        ...style
      }}
    />
  )
}

function CloseIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden>
      <path
        d="M2 2 L10 10 M10 2 L2 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Toast({
  open,
  onOpenChange,
  variant = 'info',
  title,
  description,
  action,
  durationMs,
  dismissible = true,
  className,
  style
}: ToastProps): React.ReactElement {
  const isError = variant === 'error'
  const effectiveDuration = durationMs ?? (isError ? Infinity : undefined)

  return (
    <RadixToast.Root
      open={open}
      onOpenChange={onOpenChange}
      duration={effectiveDuration}
      className={cn('ui-native-toast', className)}
      style={{
        display: 'grid',
        gridTemplateColumns: '4px 1fr auto',
        gridColumnGap: 12,
        alignItems: 'center',
        padding: '10px 12px 10px 8px',
        background: 'var(--color-surface-card-elevated)',
        border: '1px solid var(--color-divider-strong)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-toast, 0 4px 16px rgba(0,0,0,0.28))',
        color: 'var(--color-fg-primary)',
        fontFamily: 'var(--font-sans)',
        animation: 'toast-in var(--duration-standard) var(--ease-standard) both',
        ...style
      }}
    >
      <span
        aria-hidden
        style={{
          alignSelf: 'stretch',
          width: 3,
          borderRadius: 2,
          background: VARIANT_ACCENT[variant]
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <RadixToast.Title
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.3,
            color: 'var(--color-fg-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {title}
        </RadixToast.Title>
        {description && (
          <RadixToast.Description
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.4,
              color: 'var(--color-fg-tertiary)'
            }}
          >
            {description}
          </RadixToast.Description>
        )}
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {action && (
          <RadixToast.Action asChild altText={action.altText}>
            <button
              type="button"
              onClick={action.onClick}
              style={{
                paddingInline: 8,
                paddingBlock: 4,
                background: 'transparent',
                color: 'var(--color-accent)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {action.label}
            </button>
          </RadixToast.Action>
        )}
        {dismissible && (
          <RadixToast.Close asChild>
            <button
              type="button"
              aria-label="Dismiss"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20,
                height: 20,
                background: 'transparent',
                color: 'var(--color-fg-tertiary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <CloseIcon />
            </button>
          </RadixToast.Close>
        )}
      </div>
    </RadixToast.Root>
  )
}
