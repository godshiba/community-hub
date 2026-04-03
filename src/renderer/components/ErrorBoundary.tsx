import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { GlassCard } from './glass/GlassCard'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
  panelName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[ErrorBoundary] ${this.props.panelName ?? 'Panel'} crashed:`, error, info.componentStack)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <GlassCard className="flex flex-col items-center justify-center h-full gap-3 p-8">
          <AlertTriangle className="size-8 text-yellow-400 opacity-60" />
          <h3 className="text-sm font-medium text-text-primary">
            Something went wrong{this.props.panelName ? ` in ${this.props.panelName}` : ''}
          </h3>
          <p className="text-xs text-text-muted text-center max-w-xs">
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
          >
            <RotateCcw className="size-3" />
            Try again
          </button>
        </GlassCard>
      )
    }

    return this.props.children
  }
}
