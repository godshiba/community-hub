import { useEffect, useState } from 'react'

/**
 * Dev-only token showcase rendered when the URL hash is `#/dev` and the
 * Vite build is a development build. Provides a single-page view of every
 * design token in globals.css so visual QA can verify Phase 0 foundation
 * without touching production panels.
 *
 * Intentionally plain — uses raw CSS variables rather than ui-native
 * primitives (which arrive in Phase 1) so the page works even when
 * components have not yet been built.
 */

const FG_TOKENS = [
  '--color-fg-primary',
  '--color-fg-secondary',
  '--color-fg-tertiary',
  '--color-fg-disabled'
]

const SURFACE_TOKENS = [
  '--color-surface-sidebar',
  '--color-surface-inspector',
  '--color-surface-card',
  '--color-surface-card-raised',
  '--color-surface-card-elevated',
  '--color-surface-input'
]

const SEMANTIC_TOKENS = [
  '--color-success',
  '--color-warning',
  '--color-error',
  '--color-destructive',
  '--color-discord',
  '--color-telegram'
]

const RADII = ['xs', 'sm', 'md', 'lg', 'xl', 'full'] as const
const SPACES = ['1', '2', '3', '4', '5', '6', '8', '10', '12', '16'] as const

const TYPE_SCALE: ReadonlyArray<{ name: string; size: number; weight: number; lineHeight: number }> = [
  { name: 'caption', size: 11, weight: 500, lineHeight: 1.4 },
  { name: 'footnote', size: 12, weight: 400, lineHeight: 1.5 },
  { name: 'body', size: 13, weight: 400, lineHeight: 1.55 },
  { name: 'base', size: 15, weight: 400, lineHeight: 1.5 },
  { name: 'subhead', size: 15, weight: 600, lineHeight: 1.4 },
  { name: 'title-3', size: 17, weight: 600, lineHeight: 1.3 },
  { name: 'title-2', size: 22, weight: 600, lineHeight: 1.2 },
  { name: 'title-1', size: 28, weight: 700, lineHeight: 1.1 },
  { name: 'hero', size: 34, weight: 700, lineHeight: 1.05 }
]

function Section({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-fg-tertiary)',
        marginBottom: 16
      }}>{title}</h2>
      {children}
    </section>
  )
}

function ColorSwatch({ name }: { name: string }): React.ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8 }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 8,
        background: `var(${name})`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)'
      }} />
      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-fg-secondary)' }}>{name}</code>
    </div>
  )
}

export function DevPreview(): React.ReactElement {
  const [accentRead, setAccentRead] = useState<string>('…')
  const [platform, setPlatform] = useState<string>('…')
  const [locale, setLocale] = useState<string>('…')

  useEffect(() => {
    void window.api.invoke('system:getAccentColor').then((r) => {
      setAccentRead(r.success ? (r.data ?? 'graphite (null)') : `error: ${r.error}`)
    })
    void window.api.invoke('system:getPlatform').then((r) => {
      setPlatform(r.success ? r.data : `error: ${r.error}`)
    })
    void window.api.invoke('system:getUserLocale').then((r) => {
      setLocale(r.success ? r.data : `error: ${r.error}`)
    })
  }, [])

  return (
    <div style={{
      padding: 48,
      maxWidth: 1080,
      margin: '0 auto',
      color: 'var(--color-fg-primary)',
      overflowY: 'auto',
      height: '100%'
    }}>
      <h1 style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.05, marginBottom: 8 }}>
        Design Tokens
      </h1>
      <p style={{ color: 'var(--color-fg-secondary)', marginBottom: 40 }}>
        Phase 0 foundation preview. Accent: <strong>{accentRead}</strong> ·
        Platform: <strong>{platform}</strong> · Locale: <strong>{locale}</strong>
      </p>

      <Section title="Foreground">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
          {FG_TOKENS.map((t) => <ColorSwatch key={t} name={t} />)}
        </div>
      </Section>

      <Section title="Surfaces (on vibrancy)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
          {SURFACE_TOKENS.map((t) => <ColorSwatch key={t} name={t} />)}
        </div>
      </Section>

      <Section title="Accent (system-piped)">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 12, background: 'var(--color-accent)' }} />
          <div style={{ width: 80, height: 80, borderRadius: 12, background: 'var(--color-accent-fill)' }} />
          <div style={{ width: 80, height: 80, borderRadius: 12, background: 'var(--color-accent-fill-hover)' }} />
          <div style={{ width: 80, height: 80, borderRadius: 12, background: 'var(--color-accent-hover)' }} />
        </div>
      </Section>

      <Section title="Semantic">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {SEMANTIC_TOKENS.map((t) => <ColorSwatch key={t} name={t} />)}
        </div>
      </Section>

      <Section title="Typography scale">
        {TYPE_SCALE.map((t) => (
          <div key={t.name} style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 24,
            padding: '8px 0',
            borderBottom: '1px solid var(--color-divider)'
          }}>
            <code style={{ width: 96, color: 'var(--color-fg-tertiary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              {t.name}
            </code>
            <span style={{ fontSize: t.size, fontWeight: t.weight, lineHeight: t.lineHeight }}>
              The quick brown fox jumps over the lazy dog 0123
            </span>
          </div>
        ))}
      </Section>

      <Section title="Radii">
        <div style={{ display: 'flex', gap: 16 }}>
          {RADII.map((r) => (
            <div key={r} style={{ textAlign: 'center' }}>
              <div style={{
                width: 80,
                height: 80,
                background: 'var(--color-surface-card-raised)',
                borderRadius: `var(--radius-${r})`
              }} />
              <code style={{ fontSize: 11, color: 'var(--color-fg-tertiary)' }}>--radius-{r}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
          {SPACES.map((s) => (
            <div key={s} style={{ textAlign: 'center' }}>
              <div style={{
                width: `var(--space-${s})`,
                height: 48,
                background: 'var(--color-accent-fill)'
              }} />
              <code style={{ fontSize: 11, color: 'var(--color-fg-tertiary)' }}>{s}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Shadows">
        <div style={{ display: 'flex', gap: 24 }}>
          {['popover', 'modal', 'toast'].map((s) => (
            <div key={s} style={{
              width: 160,
              height: 100,
              background: 'var(--color-surface-card-elevated)',
              borderRadius: 12,
              boxShadow: `var(--shadow-${s})`,
              display: 'grid',
              placeItems: 'center',
              fontSize: 12,
              color: 'var(--color-fg-secondary)'
            }}>--shadow-{s}</div>
          ))}
        </div>
      </Section>

      <Section title="Motion">
        {[
          { name: 'fast', ms: 140 },
          { name: 'standard', ms: 220 },
          { name: 'slow', ms: 360 }
        ].map((m) => (
          <MotionDemo key={m.name} name={m.name} ms={m.ms} />
        ))}
      </Section>
    </div>
  )
}

function MotionDemo({ name, ms }: { name: string; ms: number }): React.ReactElement {
  const [on, setOn] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
      <button
        onClick={() => setOn((v) => !v)}
        style={{
          padding: '4px 10px',
          fontSize: 12,
          borderRadius: 6,
          border: '1px solid var(--color-divider)',
          background: 'var(--color-surface-card-raised)',
          color: 'var(--color-fg-primary)',
          cursor: 'pointer'
        }}
      >
        --duration-{name} ({ms}ms)
      </button>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'var(--color-accent)',
        transform: on ? 'translateX(160px)' : 'translateX(0)',
        transition: `transform var(--duration-${name}) var(--ease-standard)`
      }} />
    </div>
  )
}
