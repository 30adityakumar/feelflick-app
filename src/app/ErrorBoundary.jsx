// src/app/ErrorBoundary.jsx
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null, errorInfo: null }
  
  static getDerivedStateFromError(error) {
    return { error }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo?.componentStack)
    this.setState({ errorInfo })
  }
  
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a121a] via-[#0d1722] to-[#0c1017] p-4">
          {/* Background orbs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative max-w-2xl w-full mx-auto text-center">
            {/* Brand logo */}
            <div className="mb-6">
              <span className="text-3xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
                FEELFLICK
              </span>
            </div>
            
            {/* Error message */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Oops! Something went wrong
              </h2>
              <p className="text-white/70 text-base sm:text-lg mb-6">
                We've hit a snag. Don't worry—your data is safe. Try refreshing the page.
              </p>
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-8 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold hover:bg-white/20 transition-all duration-300"
                >
                  Go Home
                </button>
              </div>
              
              {/* Technical details (collapsible) */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-white/50 hover:text-white/70 mb-2">
                    Show technical details
                  </summary>
                  <pre className="rounded-lg bg-black/40 p-4 text-xs text-white/70 overflow-auto max-h-48 border border-white/10">
                    {String(this.state.error)}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
            
            {/* Support link */}
            <p className="mt-6 text-sm text-white/50">
              Still having issues?{' '}
              <a href="mailto:support@feelflick.com" className="text-purple-400 hover:text-purple-300 underline">
                Contact support
              </a>
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
