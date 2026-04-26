import type { CSSProperties, ReactNode } from 'react'

export interface HeroTitleProps {
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  style?: CSSProperties
}

const ROOT: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  paddingBottom: 'var(--space-2)'
}

const TITLE: CSSProperties = {
  fontSize: 34,
  lineHeight: 1.05,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: 'var(--color-fg-primary)',
  margin: 0
}

const SUBTITLE: CSSProperties = {
  fontSize: 15,
  lineHeight: 1.4,
  color: 'var(--color-fg-secondary)',
  marginTop: 6
}

export function HeroTitle({ title, subtitle, trailing, style }: HeroTitleProps): React.ReactElement {
  return (
    <header style={{ ...ROOT, ...style }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={TITLE}>{title}</h1>
        {subtitle != null && <p style={SUBTITLE}>{subtitle}</p>}
      </div>
      {trailing != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
          {trailing}
        </div>
      )}
    </header>
  )
}
