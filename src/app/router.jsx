// src/app/router.jsx
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

// Root shells
import AppShell from '@/app/AppShell'

// Public pages (no header/sidebar)
import Landing from '@/features/landing/Landing'
import AuthPage from '@/features/auth/AuthPage'

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
    return () => {
      if (typeof unsub === 'function') unsub()
    }
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
    return () => {
      if (typeof unsub === 'function') unsub()
    }
  }, [])
  if (status === 'loading') return <div className="p-6 text-white/70">Loading…</div>
  if (status === 'authed') return <Navigate to="/home" replace />
  return children
}

/* ---------------------- Onboarding completion gate ----------------------- */
const isStrictTrue = (v) => v === true

function PostAuthGate() {
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)
  const decidedAt = useRef(0)
  const navigating = useRef(false)
  const loc = useLocation()
  const navigate = useNavigate()

  // If we *just* finished onboarding, allow straight through once
  if (loc.state?.fromOnboarding === true) {
    return <Outlet />
  }

  useEffect(() => {
    let mounted = true

    // Reuse decision for ~60s to avoid loops/races
    const now = Date.now()
    if (decidedAt.current && now - decidedAt.current < 60_000) {
      setReady(true)
      return
    }

    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return

      if (!user) {
        // not signed in — let RequireAuth handle redirect
        setDone(false); setReady(true)
        decidedAt.current = Date.now()
        return
      }

      // Fast path via auth metadata
      const meta = user.user_metadata || {}
      if (
        isStrictTrue(meta.onboarding_complete) ||
        isStrictTrue(meta.has_onboarded) ||
        isStrictTrue(meta.onboarded)
      ) {
        setDone(true); setReady(true)
        decidedAt.current = Date.now()
        return
      }

      // DB check
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_complete,onboarding_completed_at')
        .eq('id', user.id)
        .maybeSingle()

      if (!mounted) return
      if (error) {
        // On error, don’t bounce forever — assume “not done” for this page-load
        console.warn('users select error:', error)
        setDone(false)
      } else {
        const completed =
          isStrictTrue(data?.onboarding_complete) ||
          Boolean(data?.onboarding_completed_at)
        setDone(completed)
      }
      setReady(true)
      decidedAt.current = Date.now()
    })()

    return () => { mounted = false }
  }, [])

  // Never call navigate repeatedly
  useEffect(() => {
    if (!ready || navigating.current) return
    if (!done && loc.pathname !== '/onboarding') {
      navigating.current = true
      navigate('/onboarding', { replace: true, state: { fromGate: true } })
    }
    if (done && loc.pathname === '/onboarding') {
      navigating.current = true
      navigate('/home', { replace: true, state: { fromOnboarding: true } })
    }
  }, [ready, done, loc.pathname, navigate])

  // If we are already on the correct route, just render children.
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
  /* Public branch (no app chrome) */
  {
    element: <PublicShell />,
    children: [
      // Landing (signed-out only)
      { index: true, element: <RedirectIfAuthed><Landing /></RedirectIfAuthed> },

      // Auth (Google-only UI; same page for sign-in/sign-up so it feels seamless)
      { path: 'auth', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'auth/sign-in', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'auth/sign-up', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },

      // Legacy aliases still pointing at the single Auth page
      { path: 'auth/log-in-or-create-account', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'login', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'signup', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'signin', element: <Navigate to="/login" replace /> },
      { path: 'register', element: <Navigate to="/signup" replace /> },

      // Explicit logout route
      { path: 'logout', element: <SignOutRoute /> },
    ],
  },

  /* App branch (header + sidebar chrome) */
  {
    element: <AppShell />,
    children: [
      // Publicly viewable pages with app chrome
      { path: 'movies', element: <MoviesTab /> },
      { path: 'movie/:id', element: <MovieDetail /> },
      { path: 'browse', element: <MoviesTab /> },
      { path: 'trending', element: <MoviesTab /> },

      // Auth-required pages (gated by onboarding)
      {
        element: <RequireAuth />,
        children: [
          {
            element: <PostAuthGate />,
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

  /* /app legacy alias */
  { path: 'app', element: <AppPrefixAlias /> },
  { path: 'app/*', element: <AppPrefixAlias /> },

  /* 404 */
  { path: '*', element: <NotFound /> },
])