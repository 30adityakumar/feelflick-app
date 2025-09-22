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
import ErrorBoundary from '@/app/ErrorBoundary'

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
  const [phase, setPhase] = useState('checking') // 'checking' | 'ready'
  const [done, setDone] = useState(false)
  const loc = useLocation()

  useEffect(() => {
    let mounted = true
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { mounted && setDone(false); mounted && setPhase('ready'); return }

      // 1) metadata quick check
      const meta = user.user_metadata || {}
      if (
        isStrictTrue(meta.onboarding_complete) ||
        isStrictTrue(meta.has_onboarded) ||
        isStrictTrue(meta.onboarded)
      ) {
        if (mounted) { setDone(true); setPhase('ready') }
        return
      }

      // 2) users table (supports id or uid column)
      const uid = user.id
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_complete,has_onboarded,onboarded,onboarding_completed_at')
        .or(`id.eq.${uid},uid.eq.${uid}`)
        .maybeSingle()

      if (error) {
        console.warn('users select error:', error)
        if (mounted) { setDone(false); setPhase('ready') }
        return
      }

      const completed =
        isStrictTrue(data?.onboarding_complete) ||
        isStrictTrue(data?.has_onboarded) ||
        isStrictTrue(data?.onboarded) ||
        Boolean(data?.onboarding_completed_at)

      if (mounted) { setDone(completed); setPhase('ready') }
    }
    check()
    return () => { mounted = false }
  }, [])

  if (phase === 'checking') return <div className="p-6 text-white/70">Loading…</div>

  // If not done and not already on /onboarding → send to /onboarding
  if (!done && loc.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace state={{ from: loc }} />
  }

  // If done but on /onboarding → send to /home
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
  // Public branch
  {
    element: <PublicShell />,
    children: [
      { index: true, element: <RedirectIfAuthed><Landing /></RedirectIfAuthed> },
      { path: 'auth', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },

      // legacy/aliases
      { path: 'auth/sign-in', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'auth/sign-up', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'login', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'signup', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'signin', element: <Navigate to="/login" replace /> },
      { path: 'register', element: <Navigate to="/signup" replace /> },

      // Email flows (add several aliases so any template works)
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'auth/reset-password', element: <ResetPassword /> },
      { path: 'confirm-email', element: <ConfirmEmail /> },
      { path: 'auth/confirm', element: <ConfirmEmail /> },
      { path: 'auth/verify', element: <ConfirmEmail /> },

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
      { path: 'browse', element: <MoviesTab /> },   // aliases
      { path: 'trending', element: <MoviesTab /> },

      // Auth-required + onboarding gate
      {
        element: <RequireAuth />,
        children: [
          {
            element: <PostAuthGate />,    // <— enforces onboarding
            children: [
              { path: 'home', element: <ErrorBoundary><HomePage /></ErrorBoundary> },
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