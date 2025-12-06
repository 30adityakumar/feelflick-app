// src/app/App.jsx
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { WatchlistProvider } from '@/contexts/WatchlistContext'

export default function App() {
  return (
    <WatchlistProvider>
      <RouterProvider router={router} />
    </WatchlistProvider>
  )
}
