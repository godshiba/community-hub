import { Dialog } from 'radix-ui'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'

export type SheetWidth = 'sm' | 'md' | 'lg' | 'xl' | number

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  description?: ReactNode
  width?: SheetWidth
  ariaLabel?: string
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  children: ReactNode
  footer?: ReactNode
  className?: string
  contentStyle?: CSSProperties
}

const WIDTH_PX: Record<Exclude<SheetWidth, number>, number> = {
  sm: 420,
  md: 560,
  lg: 720,
  xl: 960
}

function resolveWidth(w: SheetWidth): number {
  return typeof w === 'number' ? w : WIDTH_PX[w]
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  width = 'md',
  ariaLabel,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
  footer,
  className,
  contentStyle
}: SheetProps): React.ReactElement {
  const contentWidth = resolveWidth(width)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="ui-native-sheet-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.32)',
            backdropFilter: 'blur(2px)',
            zIndex: 'var(--z-modal)' as unknown as number,
            animation: 'backdrop-in var(--duration-standard) var(--ease-standard) both'
          }}
        />
        <Dialog.Content
          aria-label={ariaLabel}
          onInteractOutside={(e) => {
            if (!closeOnOverlayClick) e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            if (!closeOnEscape) e.preventDefault()
          }}
          className={cn('ui-native-sheet-content', className)}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            translate: '-50% -50%',
            width: contentWidth,
            maxWidth: 'calc(100vw - 48px)',
            maxHeight: 'calc(100vh - 96px)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-surface-card-raised)',
            border: '1px solid var(--color-divider-strong)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-modal)',
            color: 'var(--color-fg-primary)',
            zIndex: 'var(--z-modal)' as unknown as number,
            outline: 'none',
            transformOrigin: 'center center',
            animation: 'modal-in var(--duration-standard) var(--ease-standard) both',
            ...contentStyle
          }}
        >
          {(title || description) && (
            <header
              style={{
                padding: '16px 20px 12px',
                borderBottom: '1px solid var(--color-divider)'
              }}
            >
              {title && (
                <Dialog.Title
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
                </Dialog.Title>
              )}
              {description && (
                <Dialog.Description
                  style={{
                    margin: '4px 0 0',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    color: 'var(--color-fg-tertiary)',
                    lineHeight: 1.4
                  }}
                >
                  {description}
                </Dialog.Description>
              )}
            </header>
          )}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '16px 20px'
            }}
          >
            {children}
          </div>
          {footer && (
            <footer
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 8,
                padding: '12px 20px 16px',
                borderTop: '1px solid var(--color-divider)'
              }}
            >
              {footer}
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const SheetClose = Dialog.Close
export const SheetTrigger = Dialog.Trigger
