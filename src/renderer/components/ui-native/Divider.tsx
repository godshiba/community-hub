import { memo, type CSSProperties } from 'react'

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  weight?: 'hairline' | 'strong'
  inset?: number
  className?: string
  style?: CSSProperties
}

export const Divider = memo(function Divider({
  orientation = 'horizontal',
  weight = 'hairline',
  inset = 0,
  className,
  style
}: DividerProps): React.ReactElement {
  const color = weight === 'strong' ? 'var(--color-divider-strong)' : 'var(--color-divider)'
  const isHorizontal = orientation === 'horizontal'

  const merged: CSSProperties = isHorizontal
    ? {
        width: 'auto',
        height: 1,
        background: color,
        marginInline: inset,
        ...style
      }
    : {
        width: 1,
        height: 'auto',
        alignSelf: 'stretch',
        background: color,
        marginBlock: inset,
        ...style
      }

  return <div role="separator" aria-orientation={orientation} className={className} style={merged} />
})
