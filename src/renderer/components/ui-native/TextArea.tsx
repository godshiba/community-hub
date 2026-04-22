import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type ReactNode,
  type TextareaHTMLAttributes
} from 'react'
import { cn } from '@renderer/lib/utils'

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | boolean
  hint?: ReactNode
  characterCount?: boolean
  maxLength?: number
  /** Auto-grow up to maxRows; after that the textarea scrolls. Default 8. */
  maxRows?: number
  /** Initial/minimum rows before auto-grow kicks in. Default 3. */
  minRows?: number
  fullWidth?: boolean
  containerClassName?: string
  containerStyle?: CSSProperties
}

const LINE_HEIGHT = 1.55
const FONT_SIZE = 13

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  {
    error,
    hint,
    characterCount = false,
    maxLength,
    maxRows = 8,
    minRows = 3,
    fullWidth = true,
    disabled,
    readOnly,
    value,
    defaultValue,
    id,
    onChange,
    className,
    style,
    containerClassName,
    containerStyle,
    ...rest
  },
  ref
) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const innerRef = useRef<HTMLTextAreaElement | null>(null)
  useImperativeHandle(ref, () => innerRef.current!, [])

  const hasError = Boolean(error)
  const errorText = typeof error === 'string' ? error : undefined

  const resize = (): void => {
    const el = innerRef.current
    if (!el) return
    el.style.height = 'auto'
    const lineHeightPx = FONT_SIZE * LINE_HEIGHT
    const maxHeight = Math.ceil(lineHeightPx * maxRows) + 16
    const next = Math.min(el.scrollHeight, maxHeight)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }

  useEffect(() => {
    resize()
    // Re-run on value change via the effect below
  })

  useEffect(() => {
    resize()
  }, [value])

  const stringValue = typeof value === 'string' ? value : typeof defaultValue === 'string' ? defaultValue : ''
  const showCount = characterCount && typeof maxLength === 'number'

  const shell: CSSProperties = {
    display: 'block',
    width: fullWidth ? '100%' : undefined,
    padding: '8px 10px',
    background: readOnly ? 'var(--color-surface-card)' : 'var(--color-surface-input)',
    border: `1px solid ${hasError ? 'var(--color-error)' : 'var(--color-divider)'}`,
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-sans)',
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    color: 'var(--color-fg-primary)',
    resize: 'none',
    outline: 'none',
    boxShadow: readOnly ? undefined : 'inset 0 1px 0 rgba(0,0,0,0.35)',
    opacity: disabled ? 0.38 : 1,
    minHeight: Math.ceil(FONT_SIZE * LINE_HEIGHT * minRows) + 16,
    transition:
      'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
    ...style
  }

  return (
    <div
      className={cn(containerClassName)}
      style={{ display: 'flex', flexDirection: 'column', gap: 4, width: fullWidth ? '100%' : undefined, ...containerStyle }}
    >
      <textarea
        ref={innerRef}
        id={fieldId}
        rows={minRows}
        disabled={disabled}
        readOnly={readOnly}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        aria-invalid={hasError || undefined}
        className={cn('ui-native-field', hasError && 'ui-native-field--error', className)}
        style={shell}
        onChange={(e) => {
          resize()
          onChange?.(e)
        }}
        {...rest}
      />
      {(errorText || hint || showCount) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, lineHeight: 1.4 }}>
          <span style={{ color: errorText ? 'var(--color-error)' : 'var(--color-fg-tertiary)' }}>
            {errorText ?? hint}
          </span>
          {showCount && (
            <span style={{ color: 'var(--color-fg-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
              {stringValue.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  )
})
