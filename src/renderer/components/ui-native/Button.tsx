import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode
} from 'react'
import { cn } from '@renderer/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'plain' | 'destructive' | 'icon'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'prefix'> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leading?: ReactNode
  trailing?: ReactNode
  fullWidth?: boolean
}

const SIZE: Record<ButtonSize, { height: number; paddingInline: number; fontSize: number; gap: number }> = {
  sm: { height: 24, paddingInline: 10, fontSize: 12, gap: 6 },
  md: { height: 28, paddingInline: 12, fontSize: 13, gap: 6 },
  lg: { height: 34, paddingInline: 16, fontSize: 14, gap: 8 }
}

function Spinner({ size = 12 }: { size?: number }): React.ReactElement {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '1.5px solid currentColor',
        borderTopColor: 'transparent',
        display: 'inline-block',
        animation: 'button-spin 0.7s linear infinite',
        flexShrink: 0,
        opacity: 0.9
      }}
    />
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    isLoading = false,
    leading,
    trailing,
    fullWidth = false,
    disabled,
    className,
    style,
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  const sz = SIZE[size]
  const isIcon = variant === 'icon'

  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sz.gap,
    height: sz.height,
    paddingInline: isIcon ? 0 : sz.paddingInline,
    width: isIcon ? sz.height : fullWidth ? '100%' : undefined,
    fontSize: sz.fontSize,
    fontWeight: 500,
    fontFamily: 'var(--font-sans)',
    lineHeight: 1,
    borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    cursor: isLoading || disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.38 : 1,
    userSelect: 'none',
    outline: 'none',
    transition:
      'background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard), transform var(--duration-instant) var(--ease-standard)',
    WebkitAppRegion: 'no-drag' as unknown as CSSProperties['WebkitAppRegion'],
    ...style
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn('ui-native-button', `ui-native-button--${variant}`, className)}
      style={base}
      {...rest}
    >
      {isLoading ? <Spinner size={sz.fontSize} /> : leading}
      {!isIcon && children}
      {isIcon && !isLoading && children}
      {!isLoading && trailing}
    </button>
  )
})
