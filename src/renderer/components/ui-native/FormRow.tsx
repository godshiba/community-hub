import { Children, cloneElement, isValidElement, useId, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'

export type FormRowLayout = 'stacked' | 'inline'

export interface FormRowProps {
  label?: ReactNode
  /** Renders the control(s). A single form element receives `id` automatically when no htmlFor is set. */
  children: ReactNode
  hint?: ReactNode
  error?: string | boolean
  /** "Required" caption next to label. Apple convention — no asterisk. */
  required?: boolean
  /** "(Optional)" caption next to label. */
  optional?: boolean
  layout?: FormRowLayout
  /** Inline label column width. Ignored in stacked layout. */
  labelWidth?: number
  /** Override the auto-associated id (maps to <label htmlFor>). */
  htmlFor?: string
  className?: string
  style?: CSSProperties
}

export function FormRow({
  label,
  children,
  hint,
  error,
  required = false,
  optional = false,
  layout = 'stacked',
  labelWidth = 140,
  htmlFor,
  className,
  style
}: FormRowProps): React.ReactElement {
  const autoId = useId()
  const controlId = htmlFor ?? autoId
  const hasError = Boolean(error)
  const errorText = typeof error === 'string' ? error : undefined

  const content = injectIdIntoSingleChild(children, controlId, htmlFor)

  const root: CSSProperties = {
    display: 'flex',
    flexDirection: layout === 'inline' ? 'row' : 'column',
    alignItems: layout === 'inline' ? 'flex-start' : 'stretch',
    gap: layout === 'inline' ? 16 : 6,
    width: '100%',
    ...style
  }

  const labelStyle: CSSProperties = {
    fontSize: layout === 'inline' ? 13 : 13,
    fontWeight: 500,
    color: 'var(--color-fg-primary)',
    lineHeight: 1.3,
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 6,
    flexShrink: 0,
    paddingTop: layout === 'inline' ? 7 : 0,
    width: layout === 'inline' ? labelWidth : undefined
  }

  const captionStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 400,
    color: 'var(--color-fg-tertiary)'
  }

  const body: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
    minWidth: 0
  }

  const helperStyle: CSSProperties = {
    fontSize: 12,
    lineHeight: 1.4,
    color: hasError ? 'var(--color-error)' : 'var(--color-fg-tertiary)'
  }

  return (
    <div className={cn('ui-native-form-row', className)} style={root}>
      {label && (
        <label htmlFor={controlId} style={labelStyle}>
          <span>{label}</span>
          {required && <span style={captionStyle}>Required</span>}
          {optional && !required && <span style={captionStyle}>(Optional)</span>}
        </label>
      )}
      <div style={body}>
        {content}
        {(errorText || hint) && <span style={helperStyle}>{errorText ?? hint}</span>}
      </div>
    </div>
  )
}

function injectIdIntoSingleChild(children: ReactNode, id: string, explicitHtmlFor: string | undefined): ReactNode {
  if (explicitHtmlFor) return children
  const array = Children.toArray(children)
  if (array.length !== 1) return children
  const only = array[0]
  if (!isValidElement(only)) return children
  const element = only as ReactElement<{ id?: string }>
  if (element.props.id) return children
  return cloneElement(element, { id })
}
