// src/app/App.jsx
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { WatchlistProvider } from '@/contexts/WatchlistContext'
import { useSessionTracking } from '@/shared/hooks/useInteractionTracking'

export default function App() {
  useSessionTracking()
  return (
    <WatchlistProvider>
      <RouterProvider router={router} />
    </WatchlistProvider>
  )
}
