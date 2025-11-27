// src/app/ErrorBoundary.jsx
import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react'

/**
 * Production-grade Error Boundary with:
 * - Error categorization (network, client, unknown)
 * - Auto-retry logic for transient errors
 * - User-friendly messaging
 * - Branded UI
 * - Error reporting hooks
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      retryCount: 0,
      isRetrying: false,
    }
  }
  
  static getDerivedStateFromError(error) {
    // Categorize error type
    const errorType = ErrorBoundary.categorizeError(error)
    return { error, errorType }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo?.componentStack)
    
    this.setState({ errorInfo })
    
    // Report to error tracking service (Sentry, LogRocket, etc.)
    this.reportError(error, errorInfo)
    
    // Auto-retry for network errors (max 3 attempts)
    if (this.state.errorType === 'network' && this.state.retryCount < 3) {
      this.scheduleRetry()
    }
  }
  
  /**
   * Categorize error types for better user messaging
   */
  static categorizeError(error) {
    const errorStr = error?.toString?.() || ''
    const message = error?.message || ''
    
    // Network errors
    if (
      errorStr.includes('NetworkError') ||
      errorStr.includes('Failed to fetch') ||
      message.includes('network') ||
      message.includes('timeout')
    ) {
      return 'network'
    }
    
    // Client-side errors (React, JS)
    if (
      errorStr.includes('ChunkLoadError') ||
      message.includes('Loading chunk') ||
      errorStr.includes('SyntaxError')
    ) {
      return 'client'
    }
    
    // Default unknown error
    return 'unknown'
  }
  
  /**
   * Report error to monitoring service
   */
  reportError(error, errorInfo) {
    // In production, send to Sentry, LogRocket, etc.
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
      console.log('Error reported to monitoring service')
    }
  }
  
  /**
   * Schedule automatic retry for transient errors
   */
  scheduleRetry() {
    const retryDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 8000) // Exponential backoff
    
    this.setState({ isRetrying: true })
    
    setTimeout(() => {
      this.setState(prevState => ({
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
      }))
    }, retryDelay)
  }
  
  /**
   * Manual retry handler
   */
  handleRetry = () => {
    this.setState({
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      retryCount: 0,
      isRetrying: false,
    })
  }
  
  /**
   * Get user-friendly error messaging based on type
   */
  getErrorMessage() {
    const { errorType } = this.state
    
    switch (errorType) {
      case 'network':
        return {
          title: 'Connection Problem',
          description: "We're having trouble reaching our servers. Please check your internet connection and try again.",
          icon: AlertTriangle,
          canRetry: true,
        }
      case 'client':
        return {
          title: 'Something Went Wrong',
          description: 'There was a problem loading this page. Refreshing should fix it.',
          icon: AlertTriangle,
          canRetry: true,
        }
      default:
        return {
          title: 'Unexpected Error',
          description: "Something unexpected happened. Don't worry—your data is safe. Try refreshing the page.",
          icon: AlertTriangle,
          canRetry: true,
        }
    }
  }
  
  render() {
    if (this.state.error) {
      const errorMsg = this.getErrorMessage()
      const Icon = errorMsg.icon
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-black to-slate-950 p-4 relative overflow-hidden">
          {/* Background orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
          </div>
          
          <div className="relative max-w-2xl w-full mx-auto text-center">
            {/* Brand logo */}
            <div className="mb-8 animate-fade-in-down">
              <span className="inline-block text-4xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
                FEELFLICK
              </span>
            </div>
            
            {/* Error message card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl animate-scale-in">
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/20 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-rose-400" />
                </div>
              </div>
              
              {/* Title */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                {errorMsg.title}
              </h2>
              
              {/* Description */}
              <p className="text-white/70 text-base sm:text-lg mb-8 leading-relaxed max-w-xl mx-auto">
                {errorMsg.description}
              </p>
              
              {/* Retry indicator */}
              {this.state.isRetrying && (
                <div className="mb-6 flex items-center justify-center gap-2 text-sm text-white/60">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Retrying automatically...</span>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {errorMsg.canRetry && !this.state.isRetrying && (
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 touch-target"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Try Again
                  </button>
                )}
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold hover:bg-white/15 active:scale-95 transition-all duration-300 touch-target"
                >
                  <Home className="w-5 h-5" />
                  Go Home
                </button>
              </div>
              
              {/* Retry count indicator */}
              {this.state.retryCount > 0 && (
                <p className="mt-4 text-xs text-white/40">
                  Retry attempts: {this.state.retryCount}/3
                </p>
              )}
              
              {/* Technical details (collapsible, dev only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-8 text-left">
                  <summary className="cursor-pointer text-sm text-white/50 hover:text-white/70 mb-3 font-medium">
                    Show technical details
                  </summary>
                  <div className="rounded-xl bg-black/40 p-4 border border-white/10">
                    <div className="mb-3">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                        Error Type:
                      </span>
                      <span className="ml-2 text-xs text-white/70">
                        {this.state.errorType}
                      </span>
                    </div>
                    <pre className="text-xs text-white/70 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                      {String(this.state.error)}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
            
            {/* Support link */}
            <div className="mt-8 animate-fade-in-up delay-200">
              <p className="text-sm text-white/50 mb-3">
                Still having issues?
              </p>
              <a 
                href="mailto:hello@feelflick.com" 
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                <Mail className="w-4 h-4" />
                Contact Support
              </a>
            </div>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}

/**
 * Functional wrapper for using error boundary in specific components
 * Usage: <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
 */
export function ErrorBoundaryWrapper({ children, fallback }) {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}