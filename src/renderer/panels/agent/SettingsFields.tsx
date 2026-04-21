import { GlassCard } from '@/components/glass/GlassCard'

// ---------------------------------------------------------------------------
// Settings Section wrapper
// ---------------------------------------------------------------------------

export function SettingsSection({
  icon: Icon,
  title,
  children
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
        <Icon className="size-4 text-accent" />
        {title}
      </div>
      {children}
    </GlassCard>
  )
}

// ---------------------------------------------------------------------------
// Slider Field
// ---------------------------------------------------------------------------

export function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}): React.ReactElement {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs font-medium text-text-primary">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Number Field
// ---------------------------------------------------------------------------

export function NumberField({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-secondary">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (!Number.isNaN(n) && n >= min && n <= max) onChange(n)
        }}
        className="w-24 px-2 py-1 bg-white/[0.03] border border-glass-border rounded text-xs text-text-primary text-right focus:outline-none focus:ring-1 focus:ring-accent/50"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toggle Switch
// ---------------------------------------------------------------------------

export function ToggleSwitch({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}): React.ReactElement {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-8 h-4 rounded-full transition-colors ${
        checked ? 'bg-accent/40' : 'bg-white/10'
      }`}
    >
      <div
        className={`absolute top-0.5 size-3 rounded-full transition-all ${
          checked ? 'left-4 bg-accent' : 'left-0.5 bg-text-muted'
        }`}
      />
    </button>
  )
}
