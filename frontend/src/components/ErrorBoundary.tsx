import { Component, ReactNode } from 'react'
import ServerErrorPage from '@/pages/errors/ServerErrorPage'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
    // In production this is where you'd forward to an error-tracking service
    // (Sentry, etc). Logged here so failures are never silently swallowed.
    console.error('Unhandled render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return <ServerErrorPage />
    }
    return this.props.children
  }
}
