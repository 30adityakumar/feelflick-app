// src/router.jsx
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

// Root shells
import AppShell from '@/app/AppShell'

// Public pages (no header/sidebar)
import Landing from '@/features/landing/Landing'
import AuthPage from '@/features/auth/AuthPage'
import ResetPassword from '@/features/auth/components/ResetPassword'
import ConfirmEmail from '@/features/auth/components/ConfirmEmail'

import LogInOrCreateAccount from '@/features/auth/pages/LogInOrCreateAccount'
import LogInPassword from '@/features/auth/pages/LogInPassword'
import CreateAccountPassword from '@/features/auth/pages/CreateAccountPassword'

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
    let unsub
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? 'authed' : 'anon')
    })
    const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
      setStatus(session ? 'authed' : 'anon')
    })
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  if (status === 'loading') return <div className="p-6 text-white/70">Loading…</div>
  if (status === 'anon') return <Navigate to="/auth" replace state={{ from: loc }} />
  return <Outlet />
}

/** Redirect signed-in users away from public pages (/, /auth) */
function RedirectIfAuthed({ children }) {
  const [status, setStatus] = useState('loading')
  useEffect(() => {
    let unsub
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? 'authed' : 'anon')
    })
    const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
      setStatus(session ? 'authed' : 'anon')
    })
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])
  if (status === 'loading') return <div className="p-6 text-white/70">Loading…</div>
  if (status === 'authed') return <Navigate to="/home" replace />
  return children
}

/* ---------------------- Onboarding completion gate ----------------------- */
const isStrictTrue = (v) => v === true

function PostAuthGate() {
  const [state, setState] = useState('checking') // 'checking' | 'ready'
  const [done, setDone] = useState(false)
  const loc = useLocation()

  // If we *just* finished onboarding, skip the gate once to avoid the flash
  if (loc.state?.fromOnboarding === true) {
    return <Outlet />
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (mounted) { setDone(false); setState('ready') }
        return
      }

      // fast path via auth metadata
      const meta = user.user_metadata || {}
      if (
        isStrictTrue(meta.onboarding_complete) ||
        isStrictTrue(meta.has_onboarded) ||
        isStrictTrue(meta.onboarded)
      ) {
        if (mounted) { setDone(true); setState('ready') }
        return
      }

      // users table (primary key is auth.users.id)
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_complete,onboarding_completed_at')
        .eq('id', user.id)
        .maybeSingle()

      if (mounted) {
        if (error) {
          console.warn('users select error:', error)
          setDone(false)
        } else {
          const completed =
            isStrictTrue(data?.onboarding_complete) ||
            Boolean(data?.onboarding_completed_at)
          setDone(completed)
        }
        setState('ready')
      }
    })()
    return () => { mounted = false }
  }, [])

  if (state === 'checking') {
    // render nothing to avoid a full-screen “Loading profile…” flash
    return null
  }

  if (!done && loc.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace state={{ from: loc }} />
  }
  if (done && loc.pathname === '/onboarding') {
    return <Navigate to="/home" replace />
  }
  return <Outlet />
}

/* ------------------------------- Utilities -------------------------------- */
function AppPrefixAlias() {
  const loc = useLocation()
  const path = loc.pathname || '/app'
  if (path === '/app') return <Navigate to={`/home${loc.search}${loc.hash}`} replace />
  const stripped = path.replace(/^\/app/, '') || '/home'
  return <Navigate to={`${stripped}${loc.search}${loc.hash}`} replace />
}

function SignOutRoute() {
  const nav = useNavigate()
  useEffect(() => {
    supabase.auth.signOut().finally(() => nav('/auth', { replace: true }))
  }, [nav])
  return <div className="p-6 text-white/70">Signing you out…</div>
}

/* -------------------------------- Router --------------------------------- */
export const router = createBrowserRouter([
  {
    element: <PublicShell />,
    children: [
      { index: true, element: <RedirectIfAuthed><Landing /></RedirectIfAuthed> },

      // Auth shell with nested pages
      {
        path: 'auth',
        element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed>,
        children: [
          { index: true, element: <Navigate to="/auth/log-in-or-create-account" replace /> },
          { path: 'log-in-or-create-account', element: <LogInOrCreateAccount /> },
          { path: 'log-in/password', element: <LogInPassword /> },
          { path: 'create-account/password', element: <CreateAccountPassword /> },
        ],
      },

      // Legacy/aliases → unify to the entry page
      { path: 'auth/sign-in', element: <Navigate to="/auth/log-in-or-create-account" replace /> },
      { path: 'auth/sign-up', element: <Navigate to="/auth/log-in-or-create-account" replace /> },
      { path: 'login',        element: <Navigate to="/auth/log-in-or-create-account" replace /> },
      { path: 'signup',       element: <Navigate to="/auth/log-in-or-create-account" replace /> },
      { path: 'signin',       element: <Navigate to="/auth/log-in-or-create-account" replace /> },
      { path: 'register',     element: <Navigate to="/auth/log-in-or-create-account" replace /> },

      // Email flows unchanged
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'confirm-email',  element: <ConfirmEmail /> },

      { path: 'logout', element: <SignOutRoute /> },
    ],
  },

  // App branch
  {
    element: <AppShell />,
    children: [
      // Public pages that still show app chrome
      { path: 'movies', element: <MoviesTab /> },
      { path: 'movie/:id', element: <MovieDetail /> },
      { path: 'browse', element: <MoviesTab /> },
      { path: 'trending', element: <MoviesTab /> },

      // Auth-required + onboarding gate
      {
        element: <RequireAuth />,
        children: [
          {
            element: <PostAuthGate />, // enforces onboarding (and skips after finishing)
            children: [
              { path: 'home', element: <HomePage /> },
              { path: 'onboarding', element: <Onboarding /> },
              { path: 'account', element: <Account /> },
              { path: 'preferences', element: <Preferences /> },
              { path: 'watchlist', element: <Watchlist /> },
              { path: 'watched', element: <HistoryPage /> },
              { path: 'history', element: <HistoryPage /> }, // legacy
            ],
          },
        ],
      },
    ],
  },

  // /app legacy alias
  { path: 'app', element: <AppPrefixAlias /> },
  { path: 'app/*', element: <AppPrefixAlias /> },

  // 404
  { path: '*', element: <NotFound /> },
])