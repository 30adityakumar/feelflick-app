import { createBrowserRouter } from 'react-router-dom'
import AppShell from '@/app/AppShell'

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('@/app/homepage/HomePage')).default }),
      },
      {
        path: 'movies',
        lazy: async () => ({ Component: (await import('@/app/pages/movies/MoviesTab')).default }),
      },
      {
        path: 'movie/:id',
        lazy: async () => ({ Component: (await import('@/app/pages/MovieDetail')).default }),
      },
      {
        path: '*',
        lazy: async () => ({ Component: (await import('@/app/pages/NotFound')).default }),
      },
    ],
  },
])