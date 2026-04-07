// src/app/App.jsx
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from '@/app/router'
import { WatchlistProvider } from '@/contexts/WatchlistContext'
import { useSessionTracking } from '@/shared/hooks/useInteractionTracking'
import { queryClient } from '@/shared/queryClient'

export default function App() {
  useSessionTracking()
  return (
    <QueryClientProvider client={queryClient}>
      <WatchlistProvider>
        <RouterProvider router={router} />
      </WatchlistProvider>
    </QueryClientProvider>
  )
}
