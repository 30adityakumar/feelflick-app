import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

// Root shells
import AppShell from '@/app/AppShell'

// Public pages (no header/sidebar)
import Landing from '@/features/landing/Landing'
import AuthPage from '@/features/auth/AuthPage'
import ResetPassword from '@/features/auth/components/ResetPassword'
import ConfirmEmail from '@/features/auth/components/ConfirmEmail'

// App pages (with header/sidebar)
import HomePage from '@/app/homepage/HomePage'
import MoviesTab from '@/app/pages/movies/MoviesTab'
import MovieDetail from '@/app/pages/MovieDetail'
import Onboarding from '@/features/onboarding/Onboarding'
import Account from '@/app/header/components/Account'
import Preferences from '@/app/header/components/Preferences'
import Watchlist from '@/app/pages/watchlist/Watchlist'
import HistoryPage from '@/app/pages/watched/WatchedTab'

// 404
import NotFound from '@/app/pages/NotFound'

/* ----------------------------- Public layout ----------------------------- */
/** Minimal layout (no header/sidebar) for landing/auth flows */
function PublicShell() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Keep the a11y helpers here too so auth pages are accessible */}
      <div className="sr-only" aria-hidden />
      <main id="main" className="min-h-[70vh]">
        <Outlet />
      </main>
    </div>
  )
}

/* ------------------------------ Auth guards ------------------------------ */
/** Protects app-only routes; redirects signed-out users to /auth */
function RequireAuth() {
  const [status, setStatus] = useState('loading') // 'loading' | 'authed' | 'anon'
  const loc = useLocation()

  useEffect(() => {
    let unsubscribe

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? 'authed' : 'anon')
    })

    // Live updates
    const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
      setStatus(session ? 'authed' : 'anon')
    })

    unsubscribe = data?.subscription?.unsubscribe
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [])

  if (status === 'loading') {
    return <div className="p-6 text-white/70">Loading…</div>
  }
  if (status === 'anon') {
    return <Navigate to="/auth" replace state={{ from: loc }} />
  }
  return <Outlet />
}

/** Wraps public pages that should bounce signed-in users into the app (/, /auth, /login, /signup, etc.) */
function RedirectIfAuthed({ children }) {
  const [status, setStatus] = useState('loading')

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

  if (status === 'loading') return <div className="p-6 text-white/70">Loading…</div>
  if (status === 'authed') return <Navigate to="/home" replace />
  return children
}

/* -------------------------------- Router --------------------------------- */
export const router = createBrowserRouter([
  /* Public branch (no header/sidebar) */
  {
    element: <PublicShell />,
    children: [
      // Landing (signed-out only)
      {
        index: true,
        element: (
          <RedirectIfAuthed>
            <Landing />
          </RedirectIfAuthed>
        ),
      },

      // Auth hub (signed-out only)
      {
        path: 'auth',
        element: (
          <RedirectIfAuthed>
            <AuthPage />
          </RedirectIfAuthed>
        ),
      },

      // Legacy aliases that should behave like /auth
      {
        path: 'login',
        element: (
          <RedirectIfAuthed>
            <AuthPage />
          </RedirectIfAuthed>
        ),
      },
      {
        path: 'signup',
        element: (
          <RedirectIfAuthed>
            <AuthPage />
          </RedirectIfAuthed>
        ),
      },
      { path: 'signin', element: <Navigate to="/login" replace /> },
      { path: 'register', element: <Navigate to="/signup" replace /> },

      // Auth flows (public endpoints used by Supabase emails)
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'confirm-email', element: <ConfirmEmail /> },
    ],
  },

  /* App branch (header + sidebar) */
  {
    element: <AppShell />,
    children: [
      // Publicly viewable app pages (keep header/sidebar chrome)
      { path: 'movies', element: <MoviesTab /> },
      { path: 'movie/:id', element: <MovieDetail /> },

      // Auth-required pages
      {
        element: <RequireAuth />,
        children: [
          { path: 'home', element: <HomePage /> },
          { path: 'onboarding', element: <Onboarding /> },
          { path: 'account', element: <Account /> },
          { path: 'preferences', element: <Preferences /> },
          { path: 'watchlist', element: <Watchlist /> },
          { path: 'watched', element: <HistoryPage /> },
        ],
      },
    ],
  },

  /* 404 catch-all (last) */
  { path: '*', element: <NotFound /> },
])