import { memo, useState, type CSSProperties } from 'react'

export interface AvatarProps {
  /** Image URL. If missing or failed to load, initials fallback renders. */
  src?: string | null
  /** Display name used to derive initials and `alt`. */
  name?: string
  /** Explicit initials override (1–2 chars). */
  initials?: string
  size?: number
  shape?: 'circle' | 'squircle'
  className?: string
  style?: CSSProperties
}

function deriveInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export const Avatar = memo(function Avatar({
  src,
  name,
  initials,
  size = 28,
  shape = 'circle',
  className,
  style
}: AvatarProps): React.ReactElement {
  const [failed, setFailed] = useState(false)
  const label = initials ?? deriveInitials(name)
  const fontSize = Math.max(10, Math.round(size * 0.4))
  const radius = shape === 'circle' ? '50%' : 'var(--radius-md)'

  const wrapper: CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    background: 'var(--color-accent-fill)',
    color: 'var(--color-accent)',
    fontSize,
    fontWeight: 600,
    letterSpacing: 0.2,
    userSelect: 'none',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
    ...style
  }

  const showImage = src && !failed

  return (
    <span className={className} style={wrapper} role="img" aria-label={name ?? 'Avatar'}>
      {showImage ? (
        <img
          src={src}
          alt={name ?? ''}
          draggable={false}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span aria-hidden>{label}</span>
      )}
    </span>
  )
})
