import { createBrowserRouter, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
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
function PublicShell() {
  return (
    <div className="min-h-screen bg-black text-white">
      <main id="main" className="min-h-[70vh]">
        <Outlet />
      </main>
    </div>
  )
}

/* ------------------------------ Auth guards ------------------------------ */
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
    return () => { if (typeof unsubscribe === 'function') unsubscribe() }
  }, [])

  if (status === 'loading') return <div className="p-6 text-white/70">Loading…</div>
  if (status === 'anon') return <Navigate to="/auth" replace state={{ from: loc }} />
  return <Outlet />
}

/** Public pages that should bounce signed-in users into the app (/, /auth, etc.) */
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
    return () => { if (typeof unsubscribe === 'function') unsubscribe() }
  }, [])
  if (status === 'loading') return <div className="p-6 text-white/70">Loading…</div>
  if (status === 'authed') return <Navigate to="/home" replace />
  return children
}

/* ------------------------------- Utilities -------------------------------- */
/** Redirects /app → /home and /app/* → /* (strip /app prefix) */
function AppPrefixAlias() {
  const loc = useLocation()
  const path = loc.pathname || '/app'
  if (path === '/app') return <Navigate to={`/home${loc.search}${loc.hash}`} replace />
  const stripped = path.replace(/^\/app/, '') || '/home'
  return <Navigate to={`${stripped}${loc.search}${loc.hash}`} replace />
}

/** Route that signs out and redirects to /auth (works even if header button fails) */
function SignOutRoute() {
  const nav = useNavigate()
  useEffect(() => {
    supabase.auth.signOut().finally(() => {
      nav('/auth', { replace: true })
    })
  }, [nav])
  return <div className="p-6 text-white/70">Signing you out…</div>
}

/* -------------------------------- Router --------------------------------- */
export const router = createBrowserRouter([
  /* Public branch (no header/sidebar) */
  {
    element: <PublicShell />,
    children: [
      // Landing (signed-out only)
      { index: true, element: <RedirectIfAuthed><Landing /></RedirectIfAuthed> },

      // Auth hub (signed-out only)
      { path: 'auth', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },

      // Legacy/alt auth paths
      { path: 'auth/sign-in', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'auth/sign-up', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'login', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'signup', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'signin', element: <Navigate to="/login" replace /> },
      { path: 'register', element: <Navigate to="/signup" replace /> },
      { path: '/auth/reset-password', element: <ResetPassword /> },

      // Auth email flows
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'confirm-email', element: <ConfirmEmail /> },

      // Explicit logout route (works from any state)
      { path: 'logout', element: <SignOutRoute /> },
    ],
  },

  /* App branch (header + sidebar) */
  {
    element: <AppShell />,
    children: [
      // Publicly viewable pages with app chrome
      { path: 'movies', element: <MoviesTab /> },
      { path: 'movie/:id', element: <MovieDetail /> },

      // Old slugs → same component
      { path: 'browse', element: <MoviesTab /> },
      { path: 'trending', element: <MoviesTab /> },

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

          // Old alias → history
          { path: 'history', element: <HistoryPage /> },
        ],
      },
    ],
  },

  /* ---- /app legacy alias (must be before 404) ---- */
  { path: 'app', element: <AppPrefixAlias /> },
  { path: 'app/*', element: <AppPrefixAlias /> },

  /* 404 catch-all (last) */
  { path: '*', element: <NotFound /> },
])