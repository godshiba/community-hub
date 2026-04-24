import type { CSSProperties, ReactNode } from 'react'

export interface GallerySectionProps {
  id: string
  title: string
  subtitle?: string
  children: ReactNode
}

const SECTION: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '24px 0',
  borderBottom: '1px solid var(--color-divider)'
}

const HEADER: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2
}

const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-sans)',
  fontSize: 17,
  fontWeight: 600,
  color: 'var(--color-fg-primary)'
}

const SUBTITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  color: 'var(--color-fg-tertiary)'
}

const BODY: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16
}

export function GallerySection({
  id,
  title,
  subtitle,
  children
}: GallerySectionProps): React.ReactElement {
  return (
    <section id={id} style={SECTION}>
      <header style={HEADER}>
        <h2 style={TITLE}>{title}</h2>
        {subtitle && <p style={SUBTITLE}>{subtitle}</p>}
      </header>
      <div style={BODY}>{children}</div>
    </section>
  )
}

export interface GalleryRowProps {
  label: string
  children: ReactNode
}

const ROW: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '140px 1fr',
  gap: 16,
  alignItems: 'center',
  paddingBlock: 8,
  borderTop: '1px solid var(--color-divider)'
}

const LABEL: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--color-fg-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
}

const CONTENT: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap'
}

export function GalleryRow({ label, children }: GalleryRowProps): React.ReactElement {
  return (
    <div style={ROW}>
      <div style={LABEL}>{label}</div>
      <div style={CONTENT}>{children}</div>
    </div>
  )
}
