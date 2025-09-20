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
/** Protects app-only routes; redirects signed-out users to /auth */
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

/** Wrap public pages that should bounce signed-in users into the app (e.g., /, /auth). */
function RedirectIfAuthed({ children }) {
  const [status, setStatus] = useState('loading')
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? 'authed' : 'anon')
    })
    const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
      setStatus(session ? 'authed' : 'anon')
    })
    return () => data?.subscription?.unsubscribe?.()
  }, [])
  if (status === 'loading') return <div className="p-6"><Spinner className="text-white/70" /></div>
  if (status === 'authed') return <Navigate to="/home" replace />
  return children
}

/* ------------------------------- Router ---------------------------------- */
export const router = createBrowserRouter([
  /* Public branch (no header/sidebar) */
  {
    element: <PublicShell />,
    children: [
      // Landing: show Landing when signed-out, redirect to /home when signed-in
      {
        index: true,
        lazy: async () => {
          const Landing = (await import('@/features/landing/Landing')).default
          const Component = () => (
            <RedirectIfAuthed>
              <Landing />
            </RedirectIfAuthed>
          )
          return { Component }
        },
      },

      // Auth hub (login/signup UI). Signed-in users bounce to /home.
      {
        path: 'auth',
        lazy: async () => {
          const AuthPage = (await import('@/features/auth/AuthPage')).default
          const Component = () => (
            <RedirectIfAuthed>
              <AuthPage />
            </RedirectIfAuthed>
          )
          return { Component }
        },
      },

      // Common legacy aliases → reuse AuthPage
      {
        path: 'login',
        lazy: async () => {
          const AuthPage = (await import('@/features/auth/AuthPage')).default
          const Component = () => (
            <RedirectIfAuthed>
              <AuthPage />
            </RedirectIfAuthed>
          )
          return { Component }
        },
      },
      {
        path: 'signup',
        lazy: async () => {
          const AuthPage = (await import('@/features/auth/AuthPage')).default
          const Component = () => (
            <RedirectIfAuthed>
              <AuthPage />
            </RedirectIfAuthed>
          )
          return { Component }
        },
      },
      { path: 'signin', element: <Navigate to="/login" replace /> },
      { path: 'register', element: <Navigate to="/signup" replace /> },

      // Auth flows
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
      // Publicly viewable app pages (keep header/sidebar visible)
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

      // Auth-required pages (RequireAuth wraps this group)
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