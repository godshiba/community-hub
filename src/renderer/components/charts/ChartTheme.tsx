import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

/**
 * Apple-native theming layer for Recharts.
 *
 * Use the named primitives below (`ThemedGrid`, `ThemedXAxis`, etc.) inside a
 * specific chart (`LineChart`, `BarChart`, …). Wrap the chart in
 * `<ChartTheme height={…}>` to get the standard ResponsiveContainer + height
 * envelope.
 *
 * For the per-series colour palette, prefer `CHART_COLORS.accent` for the
 * primary series and `CHART_COLORS.platform.*` for Discord/Telegram-aware
 * comparisons. Bars/areas should pass `radius={[BAR_RADIUS, BAR_RADIUS, 0, 0]}`
 * for top-rounded corners and `fill={CHART_COLORS.accentFill}` for the spec'd
 * 30% fill.
 */

export const CHART_COLORS = {
  accent:      'var(--color-accent)',
  accentFill:  'color-mix(in oklch, var(--color-accent) 30%, transparent)',
  success:     'var(--color-success)',
  warning:     'var(--color-warning)',
  error:       'var(--color-error)',
  platform: {
    discord:  '#5865F2',
    telegram: '#26A5E4'
  },
  axis:       'rgba(255,255,255,0.18)',
  axisTick:   'rgba(255,255,255,0.42)',
  grid:       'rgba(255,255,255,0.06)',
  cursor:     'rgba(255,255,255,0.10)'
} as const

export const BAR_RADIUS = 4 // matches --radius-sm
const TICK_FONT = 11
const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'

interface ChartThemeProps {
  height?: number
  children: ReactElement
}

/** Standard responsive container with a fixed height envelope. */
export function ChartTheme({ height = 240, children }: ChartThemeProps): ReactElement {
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

interface ThemedGridProps {
  vertical?: boolean
  horizontal?: boolean
}

export function ThemedGrid({ vertical = false, horizontal = true }: ThemedGridProps = {}): ReactElement {
  return (
    <CartesianGrid
      vertical={vertical}
      horizontal={horizontal}
      strokeDasharray="2 4"
      stroke={CHART_COLORS.grid}
    />
  )
}

interface ThemedXAxisProps {
  dataKey: string
  tickFormatter?: (value: string) => string
  hide?: boolean
}

export function ThemedXAxis({ dataKey, tickFormatter, hide = false }: ThemedXAxisProps): ReactElement {
  return (
    <XAxis
      dataKey={dataKey}
      hide={hide}
      stroke={CHART_COLORS.axis}
      tick={{
        fill: CHART_COLORS.axisTick,
        fontSize: TICK_FONT,
        fontFamily: FONT_FAMILY,
        fontVariantNumeric: 'tabular-nums'
      }}
      tickLine={false}
      axisLine={false}
      tickFormatter={tickFormatter}
      tickMargin={8}
    />
  )
}

interface ThemedYAxisProps {
  width?: number
  hide?: boolean
  domain?: [number | string, number | string]
  tickFormatter?: (value: number) => string
}

export function ThemedYAxis({
  width = 40, hide = false, domain, tickFormatter
}: ThemedYAxisProps = {}): ReactElement {
  return (
    <YAxis
      hide={hide}
      width={width}
      domain={domain}
      stroke={CHART_COLORS.axis}
      tick={{
        fill: CHART_COLORS.axisTick,
        fontSize: TICK_FONT,
        fontFamily: FONT_FAMILY,
        fontVariantNumeric: 'tabular-nums'
      }}
      tickLine={false}
      axisLine={false}
      tickFormatter={tickFormatter}
    />
  )
}

interface TooltipPayloadEntry {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
  payload?: Record<string, unknown>
}

interface ThemedTooltipContentProps {
  active?: boolean
  payload?: ReadonlyArray<TooltipPayloadEntry>
  label?: ReactNode
  valueFormatter?: (value: number | string) => string
}

const TOOLTIP_SURFACE: CSSProperties = {
  background: 'var(--color-surface-card-elevated)',
  border: '1px solid var(--color-divider-strong)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-popover)',
  padding: '6px 10px',
  fontFamily: FONT_FAMILY,
  fontSize: 12,
  color: 'var(--color-fg-primary)',
  minWidth: 120
}

const TOOLTIP_LABEL: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-fg-tertiary)',
  marginBottom: 4
}

const TOOLTIP_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  paddingBlock: 1
}

const TOOLTIP_SWATCH: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 2,
  flexShrink: 0
}

function ThemedTooltipContent({
  active, payload, label, valueFormatter
}: ThemedTooltipContentProps): ReactElement | null {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div style={TOOLTIP_SURFACE}>
      {label != null && <div style={TOOLTIP_LABEL}>{label}</div>}
      {payload.map((entry, idx) => (
        <div key={`${entry.dataKey ?? idx}`} style={TOOLTIP_ROW}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ ...TOOLTIP_SWATCH, background: entry.color ?? 'var(--color-accent)' }} />
            <span style={{ color: 'var(--color-fg-secondary)' }}>{entry.name ?? entry.dataKey}</span>
          </span>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
            {valueFormatter && entry.value != null ? valueFormatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

interface ThemedTooltipProps {
  valueFormatter?: (value: number | string) => string
  cursor?: boolean
}

export function ThemedTooltip({ valueFormatter, cursor = true }: ThemedTooltipProps = {}): ReactElement {
  return (
    <Tooltip
      cursor={cursor ? { stroke: CHART_COLORS.cursor, strokeWidth: 1 } : false}
      content={(props) => (
        <ThemedTooltipContent
          active={props.active}
          payload={props.payload as ReadonlyArray<TooltipPayloadEntry> | undefined}
          label={props.label}
          valueFormatter={valueFormatter}
        />
      )}
    />
  )
}

const LEGEND_WRAPPER: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-fg-secondary)',
  fontFamily: FONT_FAMILY,
  paddingTop: 4
}

export const LEGEND_STYLE = LEGEND_WRAPPER
