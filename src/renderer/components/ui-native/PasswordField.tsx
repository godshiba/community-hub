import { forwardRef, useState, type CSSProperties } from 'react'
import { TextField, type TextFieldProps } from './TextField'

export interface PasswordFieldProps extends Omit<TextFieldProps, 'type' | 'suffix'> {
  /** Allow the user to reveal the password. Default true. */
  revealable?: boolean
}

function EyeIcon({ open }: { open: boolean }): React.ReactElement {
  const common: CSSProperties = {
    width: 14,
    height: 14,
    display: 'block',
    color: 'currentColor'
  }
  if (open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={common} aria-hidden>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={common} aria-hidden>
      <path d="M4 4l16 16" />
      <path d="M10.6 6.1C11.05 6.04 11.52 6 12 6c6.5 0 10 6 10 6a16.3 16.3 0 0 1-3.3 4.1" />
      <path d="M6.7 7.7A16.3 16.3 0 0 0 2 12s3.5 6 10 6c1.65 0 3.13-.33 4.41-.85" />
      <path d="M14.1 14.1A3 3 0 0 1 9.9 9.9" />
    </svg>
  )
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { revealable = true, ...rest },
  ref
) {
  const [shown, setShown] = useState(false)

  const toggleButton = revealable ? (
    <button
      type="button"
      aria-label={shown ? 'Hide password' : 'Show password'}
      aria-pressed={shown}
      onClick={() => setShown((v) => !v)}
      tabIndex={0}
      style={{
        appearance: 'none',
        background: 'transparent',
        border: 'none',
        padding: 2,
        margin: 0,
        cursor: 'pointer',
        color: 'var(--color-fg-tertiary)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 3
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--color-fg-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--color-fg-tertiary)'
      }}
    >
      <EyeIcon open={shown} />
    </button>
  ) : null

  return <TextField ref={ref} type={shown ? 'text' : 'password'} suffix={toggleButton} autoComplete="current-password" {...rest} />
})
