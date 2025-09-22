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
/**
 * Decide where to send an authenticated user.
 * Rules:
 *  - If metadata has a boolean flag, trust it.
 *  - Else, read profiles(id=uid). If no row OR row says false → NOT onboarded.
 *  - If the table truly doesn’t exist (relation error), assume onboarded (legacy).
 */
async function getOnboardingDecision() {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) return { authed: false }

  const meta = user.user_metadata || {}
  for (const k of ['onboarding_complete', 'has_onboarded', 'onboarded']) {
    if (Object.prototype.hasOwnProperty.call(meta, k)) {
      return { authed: true, onboarded: !!meta[k] }
    }
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_complete, has_onboarded, onboarded, onboarding_completed_at')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      // If the relation truly doesn’t exist, don’t block legacy apps
      const msg = `${error.code || ''} ${error.message || ''}`
      if (/42P01/.test(msg) || /relation .* does not exist/i.test(msg)) {
        return { authed: true, onboarded: true }
      }
      // For permission/404/other errors, be strict → treat as NOT onboarded
      return { authed: true, onboarded: false }
    }

    if (!data) {
      // No row yet → push user through onboarding to create it
      return { authed: true, onboarded: false }
    }

    const flag =
      data.onboarding_complete ??
      data.has_onboarded ??
      data.onboarded ??
      Boolean(data.onboarding_completed_at)

    return { authed: true, onboarded: !!flag }
  } catch {
    // Network or unknown → be strict
    return { authed: true, onboarded: false }
  }
}

/** Used at /app to decide the real “start” route after sign-in */
function AppEntryRouter() {
  const nav = useNavigate()

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
  const [state, setState] = useState('loading') // 'loading' | 'home' | 'onboarding'

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
  const [state, setState] = useState('loading') // 'loading' | 'home' | 'onboarding'

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
function AppPrefixAliasStripper() {
  const loc = useLocation()
  const stripped = (loc.pathname || '').replace(/^\/app/, '') || '/home'
  return <Navigate to={`${stripped}${loc.search}${loc.hash}`} replace />
}

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
      { index: true, element: <RedirectIfAuthed><Landing /></RedirectIfAuthed> },
      { path: 'auth', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
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

      { path: 'logout', element: <SignOutRoute /> },
    ],
  },

  /* App branch (header + sidebar) */
  {
    element: <AppShell />,
    children: [
      { path: 'movies', element: <MoviesTab /> },
      { path: 'movie/:id', element: <MovieDetail /> },
      { path: 'browse', element: <MoviesTab /> },
      { path: 'trending', element: <MoviesTab /> },

      {
        element: <RequireAuth />,
        children: [
          { path: 'home', element: (
              <HomeGate>
                <HomePage />
              </HomeGate>
            )
          },
          { path: 'onboarding', element: <OnboardingGate /> },
          { path: 'account', element: <Account /> },
          { path: 'preferences', element: <Preferences /> },
          { path: 'watchlist', element: <Watchlist /> },
          { path: 'watched', element: <HistoryPage /> },
          { path: 'history', element: <HistoryPage /> },
        ],
      },
    ],
  },

  /* /app entry + legacy */
  { path: 'app', element: <AppEntryRouter /> },
  { path: 'app/*', element: <AppPrefixAliasStripper /> },

  /* 404 */
  { path: '*', element: <NotFound /> },
])