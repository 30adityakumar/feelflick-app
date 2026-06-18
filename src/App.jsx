// src/App.jsx
import * as Sentry from '@sentry/react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from '@/app/router'
import { WatchlistProvider } from '@/app/providers/WatchlistContext'
import { useSessionTracking } from '@/shared/hooks/useInteractionTracking'
import { queryClient } from '@/shared/lib/queryClient'

// === Canonical website theme boundary + rollback switch =====================
// The whole application is themed by ONE root class. `VITE_UI_THEME` selects it:
//   • 'thoughtful' (default) → `.theme-thoughtful` — the canonical Thoughtful
//     Seatmate system (warm-graphite canvas, ivory text, Inter, restrained rose).
//   • 'legacy'              → `.theme-legacy` (a no-op marker) — the pre-existing
//     :root tokens + literal fallbacks take over (emergency rollback only).
// Changing a single `--color-*` token (foundations.css) propagates everywhere
// under this class. The class is fully removable; rolling back needs no route edits.
const UI_THEME = import.meta.env.VITE_UI_THEME === 'legacy' ? 'legacy' : 'thoughtful'
const THEME_CLASS = UI_THEME === 'legacy' ? 'theme-legacy' : 'theme-thoughtful'

export default function App() {
  useSessionTracking()
  return (
    <div className={THEME_CLASS} data-ui-theme={UI_THEME} style={{ minHeight: '100vh' }}>
    <Sentry.ErrorBoundary
      fallback={() => (
        // Last-resort outer boundary (the route-level ErrorBoundary handles most
        // crashes with richer UI). Generic copy — never surface raw error.message
        // to users — plus a branded reload affordance.
        <div className="min-h-screen bg-[#06060a] flex items-center justify-center text-white text-center p-8">
          <div className="max-w-sm">
            <h1 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Something went wrong
            </h1>
            <p className="text-white/60 text-sm mb-6">
              An unexpected error occurred. Reloading usually fixes it.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md px-4 py-2 text-sm font-medium border border-white/20 text-white/80 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DD4E83]/60"
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
