import {
  forwardRef,
  useId,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode
} from 'react'
import { cn } from '@renderer/lib/utils'

export type TextFieldSize = 'sm' | 'md' | 'lg'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size'> {
  inputSize?: TextFieldSize
  prefix?: ReactNode
  suffix?: ReactNode
  error?: string | boolean
  hint?: ReactNode
  characterCount?: boolean
  maxLength?: number
  fullWidth?: boolean
  containerClassName?: string
  containerStyle?: CSSProperties
}

const SIZE: Record<TextFieldSize, { height: number; fontSize: number; paddingInline: number }> = {
  sm: { height: 24, fontSize: 12, paddingInline: 8 },
  md: { height: 28, fontSize: 13, paddingInline: 10 },
  lg: { height: 34, fontSize: 14, paddingInline: 12 }
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    inputSize = 'md',
    prefix,
    suffix,
    error,
    hint,
    characterCount = false,
    maxLength,
    fullWidth = true,
    disabled,
    readOnly,
    value,
    defaultValue,
    id,
    className,
    style,
    containerClassName,
    containerStyle,
    ...rest
  },
  ref
) {
  const sz = SIZE[inputSize]
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const hasError = Boolean(error)
  const errorText = typeof error === 'string' ? error : undefined

  const shell: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    width: fullWidth ? '100%' : undefined,
    height: sz.height,
    paddingInline: sz.paddingInline,
    background: readOnly ? 'var(--color-surface-card)' : 'var(--color-surface-input)',
    border: `1px solid ${hasError ? 'var(--color-error)' : 'var(--color-divider)'}`,
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-sans)',
    fontSize: sz.fontSize,
    color: 'var(--color-fg-primary)',
    boxShadow: readOnly ? undefined : 'inset 0 1px 0 rgba(0,0,0,0.35)',
    opacity: disabled ? 0.38 : 1,
    transition:
      'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
    cursor: disabled ? 'not-allowed' : 'text'
  }

  const input: CSSProperties = {
    flex: 1,
    minWidth: 0,
    height: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'inherit',
    font: 'inherit',
    padding: 0
  }

  const slot: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    color: 'var(--color-fg-tertiary)',
    flexShrink: 0
  }

  const stringValue = typeof value === 'string' ? value : typeof defaultValue === 'string' ? defaultValue : ''
  const showCount = characterCount && typeof maxLength === 'number'

  return (
    <div className={cn(containerClassName)} style={{ display: 'flex', flexDirection: 'column', gap: 4, width: fullWidth ? '100%' : undefined, ...containerStyle }}>
      <label
        htmlFor={fieldId}
        className={cn('ui-native-field', hasError && 'ui-native-field--error', className)}
        style={shell}
      >
        {prefix && <span style={slot}>{prefix}</span>}
        <input
          ref={ref}
          id={fieldId}
          disabled={disabled}
          readOnly={readOnly}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          aria-invalid={hasError || undefined}
          style={input}
          {...rest}
        />
        {suffix && <span style={slot}>{suffix}</span>}
      </label>
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
