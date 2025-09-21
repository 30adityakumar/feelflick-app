// src/app/router.jsx
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
  if (status === 'authed') return <Navigate to="/app" replace />
  return children
}

/* --------------------------- Onboarding helpers -------------------------- */
async function getOnboardingDecision() {
  // Returns { authed: boolean, onboarded?: boolean }
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) return { authed: false }

  // 1) Try user metadata
  const meta =
    user.user_metadata?.onboarding_complete ??
    user.user_metadata?.has_onboarded ??
    user.user_metadata?.onboarded
  if (typeof meta !== 'undefined') return { authed: true, onboarded: !!meta }

  // 2) Try profiles table (any of three possible flags)
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_complete, has_onboarded, onboarded')
      .eq('id', user.id)
      .maybeSingle()

    if (!error && data) {
      const flag =
        data.onboarding_complete ??
        data.has_onboarded ??
        data.onboarded
      if (typeof flag !== 'undefined') return { authed: true, onboarded: !!flag }
    }
  } catch {
    // ignore – fall through to default
  }

  // 3) Default: assume onboarded so we don’t trap legacy users
  return { authed: true, onboarded: true }
}

/** Used at /app to decide the real “start” route after sign-in */
function AppEntryRouter() {
  const nav = useNavigate()
  const [done, setDone] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const s = await supabase.auth.getSession()
      if (!s.data.session) {
        if (!alive) return
        nav('/auth', { replace: true })
        return
      }
      const res = await getOnboardingDecision()
      if (!alive) return
      nav(res.onboarded ? '/home' : '/onboarding', { replace: true })
    })()
    return () => { alive = false }
  }, [nav])

  return <div className="p-6 text-white/70">Loading…</div>
}

/** If not onboarded, push to /onboarding; otherwise render the page */
function HomeGate({ children }) {
  const [state, setState] = useState<'loading' | 'home' | 'onboarding'>('loading')

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await getOnboardingDecision()
      if (!alive) return
      setState(res.onboarded ? 'home' : 'onboarding')
    })()
    return () => { alive = false }
  }, [])

  if (state === 'loading') return <div className="p-6 text-white/70">Loading…</div>
  if (state === 'onboarding') return <Navigate to="/onboarding" replace />
  return children
}

/** If already onboarded, don’t show the flow again */
function OnboardingGate() {
  const [state, setState] = useState<'loading' | 'home' | 'onboarding'>('loading')

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await getOnboardingDecision()
      if (!alive) return
      setState(res.onboarded ? 'home' : 'onboarding')
    })()
    return () => { alive = false }
  }, [])

  if (state === 'loading') return <div className="p-6 text-white/70">Loading…</div>
  if (state === 'home') return <Navigate to="/home" replace />
  return <Onboarding />
}

/* ------------------------------- Utilities -------------------------------- */
/** Redirects /app/* legacy paths; /app itself uses AppEntryRouter */
function AppPrefixAliasStripper() {
  const loc = useLocation()
  const stripped = (loc.pathname || '').replace(/^\/app/, '') || '/home'
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

      // Password + email flows
      { path: 'auth/reset-password', element: <ResetPassword /> },
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
          // Home decides against onboarding
          { path: 'home', element: (
              <HomeGate>
                <HomePage />
              </HomeGate>
            )
          },
          // Onboarding bounces if already done
          { path: 'onboarding', element: <OnboardingGate /> },

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

  /* ---- /app entry & legacy alias ---- */
  // Hitting exactly /app chooses /home vs /onboarding
  { path: 'app', element: <AppEntryRouter /> },
  // Anything else under /app/* strips the prefix
  { path: 'app/*', element: <AppPrefixAliasStripper /> },

  /* 404 catch-all (last) */
  { path: '*', element: <NotFound /> },
])