import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) {
    // Helpful console breadcrumb in prod
    console.error('[Home Boundary]', error, info?.componentStack)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-3xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Something went wrong on Home.</h2>
          <p className="text-white/70 mb-4">We’re working on it. Try reloading.</p>
          <pre className="rounded bg-white/5 p-3 text-xs text-white/70 overflow-auto">
            {String(this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}