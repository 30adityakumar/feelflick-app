// src/app/App.jsx
import * as Sentry from '@sentry/react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from '@/app/router'
import { WatchlistProvider } from '@/contexts/WatchlistContext'
import { useSessionTracking } from '@/shared/hooks/useInteractionTracking'
import { queryClient } from '@/shared/queryClient'

export default function App() {
  useSessionTracking()
  return (
    <Sentry.ErrorBoundary
      fallback={({ error }) => (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white text-center p-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Something went wrong
            </h1>
            <p className="text-neutral-400 text-sm">
              {error?.message || 'An unexpected error occurred'}
            </p>
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
  )
}
