import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AppShell from '@/app/AppShell'
import SkipLink from '@/app/a11y/SkipLink'
import RouteAnnouncer from '@/app/a11y/RouteAnnouncer'
import FocusOnNavigate from '@/app/a11y/FocusOnNavigate'
import Spinner from '@/shared/ui/Spinner'
import { supabase } from '@/shared/lib/supabase/client'

/* ----------------------------- Public layout ----------------------------- */
/** Minimal layout (no header/sidebar) for landing/auth routes */
function PublicShell() {
  return (
    <div className="min-h-screen bg-black text-white">
      <SkipLink />
      <RouteAnnouncer />
      <FocusOnNavigate />
      <main id="main" className="min-h-[70vh]">
        <Outlet />
      </main>
    </div>
  )
}

/* ------------------------------ Auth guard ------------------------------- */
function RequireAuth() {
  const [status, setStatus] = useState('loading') // 'loading' | 'authed' | 'anon'
  const loc = useLocation()

  useEffect(() => {
    let unsubscribe

    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? 'authed' : 'anon')
    })

    const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
      setStatus(session ? 'authed' : 'anon')
    })

    unsubscribe = data?.subscription?.unsubscribe
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="p-6">
        <Spinner className="text-white/70" />
      </div>
    )
  }
  if (status === 'anon') {
    return <Navigate to="/auth" replace state={{ from: loc }} />
  }
  return <Outlet />
}

/* ------------------------------- Router ---------------------------------- */
export const router = createBrowserRouter([
  /* Public branch (no header/sidebar) */
  {
    element: <PublicShell />,
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import('@/features/landing/Landing')).default,
        }),
      },
      {
        path: 'auth',
        lazy: async () => ({
          Component: (await import('@/features/auth/AuthPage')).default,
        }),
      },
      {
        path: 'reset-password',
        lazy: async () => ({
          Component: (await import('@/features/auth/components/ResetPassword')).default,
        }),
      },
      {
        path: 'confirm-email',
        lazy: async () => ({
          Component: (await import('@/features/auth/components/ConfirmEmail')).default,
        }),
      },
    ],
  },

  /* App branch (header + sidebar) */
  {
    element: <AppShell />,
    children: [
      // Publicly viewable app pages (keep header/sidebar)
      {
        path: 'movies',
        lazy: async () => ({
          Component: (await import('@/app/pages/movies/MoviesTab')).default,
        }),
      },
      {
        path: 'movie/:id',
        lazy: async () => ({
          Component: (await import('@/app/pages/MovieDetail')).default,
        }),
      },

      // Auth-required pages
      {
        element: <RequireAuth />,
        children: [
          {
            path: 'home',
            lazy: async () => ({
              Component: (await import('@/app/homepage/HomePage')).default,
            }),
          },
          {
            path: 'onboarding',
            lazy: async () => ({
              Component: (await import('@/features/onboarding/Onboarding')).default,
            }),
          },
          {
            path: 'account',
            lazy: async () => ({
              Component: (await import('@/app/header/components/Account')).default,
            }),
          },
          {
            path: 'preferences',
            lazy: async () => ({
              Component: (await import('@/app/header/components/Preferences')).default,
            }),
          },
          {
            path: 'watchlist',
            lazy: async () => ({
              Component: (await import('@/app/pages/watchlist/Watchlist')).default,
            }),
          },
          {
            path: 'watched',
            lazy: async () => ({
              Component: (await import('@/app/pages/watched/WatchedTab')).default,
            }),
          },
        ],
      },
    ],
  },

  /* 404 catch-all (last) */
  {
    path: '*',
    lazy: async () => ({
      Component: (await import('@/app/pages/NotFound')).default,
    }),
  },
])