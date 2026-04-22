import { forwardRef, type HTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  /** When true, title uses uppercase caption styling (Settings-style sections). */
  caption?: boolean
  bodyStyle?: CSSProperties
}

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { title, subtitle, actions, footer, caption = false, bodyStyle, className, style, children, ...rest },
  ref
) {
  const root: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    ...style
  }

  const header: CSSProperties = {
    display: 'flex',
    alignItems: caption ? 'center' : 'flex-end',
    justifyContent: 'space-between',
    gap: 'var(--space-4)'
  }

  const titleStyle: CSSProperties = caption
    ? {
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-fg-tertiary)'
      }
    : {
        fontSize: 17,
        fontWeight: 600,
        lineHeight: 1.3,
        color: 'var(--color-fg-primary)'
      }

  const subtitleStyle: CSSProperties = {
    fontSize: 13,
    lineHeight: 1.45,
    color: 'var(--color-fg-secondary)',
    marginTop: caption ? 2 : 4
  }

  const footerStyle: CSSProperties = {
    fontSize: 12,
    color: 'var(--color-fg-tertiary)'
  }

  const showHeader = title != null || subtitle != null || actions != null

  return (
    <section ref={ref} className={cn(className)} style={root} {...rest}>
      {showHeader && (
        <header style={header}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {title != null && <h3 style={titleStyle}>{title}</h3>}
            {subtitle != null && <p style={subtitleStyle}>{subtitle}</p>}
          </div>
          {actions != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
              {actions}
            </div>
          )}
        </header>
      )}
      <div style={bodyStyle}>{children}</div>
      {footer != null && <footer style={footerStyle}>{footer}</footer>}
    </section>
  )
})
