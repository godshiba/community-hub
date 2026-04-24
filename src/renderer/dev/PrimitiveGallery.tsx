import type { CSSProperties } from 'react'
import { FoundationalGallery } from './gallery/FoundationalGallery'
import { FormGallery } from './gallery/FormGallery'
import { OverlayGallery } from './gallery/OverlayGallery'
import { FeedbackGallery } from './gallery/FeedbackGallery'

const PAGE: CSSProperties = {
  minHeight: '100vh',
  padding: '32px 40px 80px',
  background: 'var(--color-surface-window, transparent)',
  color: 'var(--color-fg-primary)',
  fontFamily: 'var(--font-sans)',
  overflowY: 'auto'
}

const HEADER: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  paddingBottom: 24,
  borderBottom: '1px solid var(--color-divider-strong)'
}

const TITLE: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 700,
  letterSpacing: '-0.01em'
}

const SUBTITLE: CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: 'var(--color-fg-tertiary)'
}

const TOC: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  paddingBlock: 16,
  fontSize: 12,
  color: 'var(--color-fg-tertiary)'
}

const TOC_LINK: CSSProperties = {
  display: 'inline-block',
  paddingInline: 8,
  paddingBlock: 3,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-divider)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-fg-secondary)',
  textDecoration: 'none'
}

const SECTIONS = [
  // Foundational
  { id: 'surface', label: 'Surface' },
  { id: 'divider', label: 'Divider' },
  { id: 'statusdot', label: 'StatusDot' },
  { id: 'pill', label: 'Pill' },
  { id: 'badge', label: 'Badge' },
  { id: 'keycap', label: 'KeyCap' },
  { id: 'avatar', label: 'Avatar' },
  { id: 'skeleton', label: 'Skeleton' },
  { id: 'section', label: 'Section' },
  // Form
  { id: 'button', label: 'Button' },
  { id: 'textfield', label: 'TextField' },
  { id: 'textarea', label: 'TextArea' },
  { id: 'passwordfield', label: 'PasswordField' },
  { id: 'numberfield', label: 'NumberField' },
  { id: 'stepper', label: 'Stepper' },
  { id: 'toggle', label: 'Toggle' },
  { id: 'checkbox', label: 'Checkbox' },
  { id: 'radio', label: 'RadioGroup' },
  { id: 'slider', label: 'Slider' },
  { id: 'select', label: 'Select' },
  { id: 'combobox', label: 'ComboBox' },
  { id: 'datepicker', label: 'DatePicker' },
  { id: 'timepicker', label: 'TimePicker' },
  { id: 'formrow', label: 'FormRow' },
  { id: 'segmentedcontrol', label: 'SegmentedControl' },
  // Overlay
  { id: 'sheet', label: 'Sheet' },
  { id: 'alert', label: 'Alert' },
  { id: 'popover', label: 'Popover' },
  { id: 'tooltip', label: 'Tooltip' },
  { id: 'contextmenu', label: 'ContextMenu' },
  { id: 'dropdownmenu', label: 'DropdownMenu' },
  { id: 'listrow', label: 'ListRow' },
  { id: 'disclosure', label: 'Disclosure' },
  { id: 'emptystate', label: 'EmptyState' },
  // Feedback
  { id: 'toast', label: 'Toast' },
  { id: 'progressbar', label: 'ProgressBar' },
  { id: 'circularprogress', label: 'CircularProgress' },
  { id: 'icons', label: 'Icons' }
] as const

/**
 * Dev-only primitive gallery rendered at `#/dev/primitives` in dev builds.
 *
 * Every `ui-native/` primitive is shown in every documented state so the
 * redesign can be visually QA'd against Apple reference apps without having
 * to navigate into real panels. Gated behind `import.meta.env.DEV` by
 * `App.tsx`.
 */
export function PrimitiveGallery(): React.ReactElement {
  return (
    <main style={PAGE}>
      <header style={HEADER}>
        <h1 style={TITLE}>ui-native Primitive Gallery</h1>
        <p style={SUBTITLE}>
          Every primitive in every state. Use with system accent color changes to
          verify theming. Toggle reduced-motion and window focus to verify edge
          states. This page is dev-only.
        </p>
        <nav style={TOC}>
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} style={TOC_LINK}>
              {s.label}
            </a>
          ))}
        </nav>
      </header>
      <FoundationalGallery />
      <FormGallery />
      <OverlayGallery />
      <FeedbackGallery />
    </main>
  )
}
