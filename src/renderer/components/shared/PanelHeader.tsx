interface PanelHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PanelHeader({ title, subtitle, actions }: PanelHeaderProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
