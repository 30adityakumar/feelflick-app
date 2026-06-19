// src/App.jsx
import * as Sentry from '@sentry/react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from '@/app/router'
import { WatchlistProvider } from '@/app/providers/WatchlistContext'
import { useSessionTracking } from '@/shared/hooks/useInteractionTracking'
import { queryClient } from '@/shared/lib/queryClient'

// One website-wide theme boundary. `thoughtful` remains the compatibility name
// for the canonical Adaptive Editorial Cinema contract: Deep Neutral Ink,
// Paper-White typography, neutral inverse actions and cinematic coral-red.
// `legacy` is a partial token-layer fallback, not an exact visual rollback; a
// full rollback requires reverting this PR.
const UI_THEME = import.meta.env.VITE_UI_THEME === 'legacy' ? 'legacy' : 'thoughtful'
const THEME_CLASS = UI_THEME === 'legacy' ? 'theme-legacy' : 'theme-thoughtful'

export default function App() {
  useSessionTracking()
  return (
    <div className={THEME_CLASS} data-ui-theme={UI_THEME} style={{ minHeight: '100vh' }}>
      <Sentry.ErrorBoundary
        fallback={() => (
          <div className="min-h-screen flex items-center justify-center text-center p-8 bg-[var(--color-canvas,#0f1010)] text-[var(--color-text-primary,#f5f2eb)]">
            <div className="max-w-sm">
              <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
              <p className="text-sm mb-6 text-[var(--color-text-secondary,#c9c5bc)]">
                An unexpected error occurred. Reloading usually fixes it.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="min-h-11 rounded-xl px-4 py-2 text-sm font-semibold border border-[var(--color-border-subtle,#3a3d41)] bg-[var(--color-surface-1,#171819)] text-[var(--color-text-primary,#f5f2eb)] hover:border-[var(--color-border-strong,#747a82)] hover:bg-[var(--color-surface-2,#222427)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus,#f5f2eb)]"
              >
                Reload
              </button>
            </div>
          </div>
        )}
        showDialog
      >
        <QueryClientProvider client={queryClient}>
          <WatchlistProvider>
            <RouterProvider router={router} />
          </WatchlistProvider>
        </QueryClientProvider>
      </Sentry.ErrorBoundary>
    </div>
  )
}
