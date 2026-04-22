import { memo, type CSSProperties } from 'react'

export type KeyCapSize = 'sm' | 'md'

export interface KeyCapProps {
  /**
   * Individual keys to render. Accepts any combination of modifier tokens
   * ("cmd", "shift", "opt", "alt", "ctrl", "enter", "esc", "delete", "tab",
   * "space", "up", "down", "left", "right") and literal characters ("K").
   */
  keys: ReadonlyArray<string>
  size?: KeyCapSize
  className?: string
  style?: CSSProperties
}

const SYMBOL_MAP: Record<string, string> = {
  cmd: '\u2318',
  meta: '\u2318',
  command: '\u2318',
  shift: '\u21E7',
  opt: '\u2325',
  alt: '\u2325',
  option: '\u2325',
  ctrl: '\u2303',
  control: '\u2303',
  enter: '\u21A9',
  return: '\u21A9',
  tab: '\u21E5',
  esc: '\u238B',
  escape: '\u238B',
  delete: '\u232B',
  backspace: '\u232B',
  up: '\u2191',
  down: '\u2193',
  left: '\u2190',
  right: '\u2192',
  space: '\u2423'
}

function renderKey(raw: string): string {
  const normalized = raw.trim().toLowerCase()
  return SYMBOL_MAP[normalized] ?? raw.toUpperCase()
}

const SIZE: Record<KeyCapSize, CSSProperties> = {
  sm: { fontSize: 10, minWidth: 16, height: 16, paddingInline: 4, borderRadius: 3 },
  md: { fontSize: 11, minWidth: 18, height: 18, paddingInline: 5, borderRadius: 4 }
}

export const KeyCap = memo(function KeyCap({
  keys,
  size = 'md',
  className,
  style
}: KeyCapProps): React.ReactElement {
  const cap: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-surface-card-elevated)',
    color: 'var(--color-fg-secondary)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    lineHeight: 1,
    boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.28)',
    ...SIZE[size]
  }

  const wrapper: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
    ...style
  }

  return (
    <span className={className} style={wrapper} aria-label={keys.join(' ')}>
      {keys.map((key, i) => (
        <span key={`${key}-${i}`} style={cap}>
          {renderKey(key)}
        </span>
      ))}
    </span>
  )
})
