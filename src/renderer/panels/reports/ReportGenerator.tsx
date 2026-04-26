import { type CSSProperties } from 'react'
import { ChartBar, SpinnerGap } from '@phosphor-icons/react'
import { useReportsStore } from '@/stores/reports.store'
import { Button } from '@/components/ui-native/Button'
import { Select } from '@/components/ui-native/Select'
import { TextField } from '@/components/ui-native/TextField'
import { Checkbox } from '@/components/ui-native/Checkbox'
import { FormRow } from '@/components/ui-native/FormRow'
import { Divider } from '@/components/ui-native/Divider'
import type { MetricCategory, ReportPeriod, ReportPlatformFilter } from '@shared/reports-types'

const PERIOD_OPTIONS = [
  { value: '7d',     label: '7 days'   },
  { value: '14d',    label: '14 days'  },
  { value: '30d',    label: '30 days'  },
  { value: '90d',    label: '90 days'  },
  { value: 'custom', label: 'Custom range' }
] as const satisfies ReadonlyArray<{ value: ReportPeriod; label: string }>

const PLATFORM_OPTIONS = [
  { value: 'all',      label: 'All platforms' },
  { value: 'discord',  label: 'Discord'  },
  { value: 'telegram', label: 'Telegram' }
] as const satisfies ReadonlyArray<{ value: ReportPlatformFilter; label: string }>

const METRICS: ReadonlyArray<{ value: MetricCategory; label: string; description: string }> = [
  { value: 'growth',     label: 'Growth',     description: 'Member counts and growth rate' },
  { value: 'engagement', label: 'Engagement', description: 'Active users, messages per user' },
  { value: 'retention',  label: 'Retention',  description: 'Retention and churn' },
  { value: 'moderation', label: 'Moderation', description: 'Warnings, bans, resolutions' },
  { value: 'events',     label: 'Events',     description: 'Events held, RSVPs, attendance' }
]

const ROOT: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: 'var(--space-4)'
}

const METRIC_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: 'var(--space-2)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer'
}

export function ReportGenerator(): React.ReactElement {
  const period           = useReportsStore((s) => s.period)
  const platformFilter   = useReportsStore((s) => s.platformFilter)
  const selectedMetrics  = useReportsStore((s) => s.selectedMetrics)
  const customStart      = useReportsStore((s) => s.customStart)
  const customEnd        = useReportsStore((s) => s.customEnd)
  const generating       = useReportsStore((s) => s.generating)
  const setPeriod        = useReportsStore((s) => s.setPeriod)
  const setPlatformFilter = useReportsStore((s) => s.setPlatformFilter)
  const toggleMetric     = useReportsStore((s) => s.toggleMetric)
  const setCustomRange   = useReportsStore((s) => s.setCustomRange)
  const generate         = useReportsStore((s) => s.generate)

  return (
    <div style={ROOT}>
      <FormRow label="Time period">
        <Select
          value={period}
          onChange={(v) => setPeriod(v as ReportPeriod)}
          options={PERIOD_OPTIONS}
          fullWidth
        />
      </FormRow>

      {period === 'custom' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormRow label="Start">
            <TextField type="date" value={customStart} onChange={(e) => setCustomRange(e.target.value, customEnd)} />
          </FormRow>
          <FormRow label="End">
            <TextField type="date" value={customEnd} onChange={(e) => setCustomRange(customStart, e.target.value)} />
          </FormRow>
        </div>
      )}

      <FormRow label="Platform">
        <Select
          value={platformFilter}
          onChange={(v) => setPlatformFilter(v as ReportPlatformFilter)}
          options={PLATFORM_OPTIONS}
          fullWidth
        />
      </FormRow>

      <Divider />

      <FormRow label="Sections">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {METRICS.map((m) => {
            const checked = selectedMetrics.includes(m.value)
            return (
              <label key={m.value} style={METRIC_ROW}>
                <Checkbox
                  checked={checked}
                  onChange={() => toggleMetric(m.value)}
                  label={m.label}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-fg-primary)' }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-fg-tertiary)', marginTop: 2 }}>{m.description}</div>
                </div>
              </label>
            )
          })}
        </div>
      </FormRow>

      <Button
        variant="primary"
        size="md"
        onClick={() => { void generate() }}
        disabled={selectedMetrics.length === 0 || generating}
        isLoading={generating}
        fullWidth
        leading={generating ? <SpinnerGap size={14} /> : <ChartBar size={14} weight="bold" />}
      >
        {generating ? 'Generating…' : 'Generate report'}
      </Button>
    </div>
  )
}
