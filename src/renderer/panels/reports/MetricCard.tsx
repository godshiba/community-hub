import { memo, type CSSProperties } from 'react'
import { Surface } from '@/components/ui-native/Surface'

interface MetricCardProps {
  label: string
  value: string | number
  positive?: boolean
  negative?: boolean
}

const CARD: CSSProperties = {
  padding: 'var(--space-3)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4
}

const LABEL: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--color-fg-tertiary)',
  letterSpacing: '0.02em'
}

export const MetricCard = memo(function MetricCard({
  label, value, positive, negative
}: MetricCardProps): React.ReactElement {
  const valueColor = positive
    ? 'var(--color-success)'
    : negative
      ? 'var(--color-error)'
      : 'var(--color-fg-primary)'
  return (
    <Surface variant="raised" radius="md" bordered style={CARD}>
      <span style={LABEL}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 600, color: valueColor, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </Surface>
  )
})
