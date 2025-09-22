// src/app/router.jsx
import { createBrowserRouter, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

import AppShell from '@/app/AppShell'
import Landing from '@/features/landing/Landing'
import AuthPage from '@/features/auth/AuthPage'
import ResetPassword from '@/features/auth/components/ResetPassword'
import ConfirmEmail from '@/features/auth/components/ConfirmEmail'
import HomePage from '@/app/homepage/HomePage'
import MoviesTab from '@/app/pages/movies/MoviesTab'
import MovieDetail from '@/app/pages/MovieDetail'
import Onboarding from '@/features/onboarding/Onboarding'
import Account from '@/app/header/components/Account'
import Preferences from '@/app/header/components/Preferences'
import Watchlist from '@/app/pages/watchlist/Watchlist'
import HistoryPage from '@/app/pages/watched/WatchedTab'
import NotFound from '@/app/pages/NotFound'

function PublicShell() {
  return (
    <div className="min-h-screen bg-black text-white">
      <main id="main" className="min-h-[70vh]">
        <Outlet />
      </main>
    </div>
  )
}

function RequireAuth() {
  const [status, setStatus] = useState('loading')
  const loc = useLocation()
  useEffect(() => {
    let unsub
    supabase.auth.getSession().then(({ data: { session } }) => setStatus(session ? 'authed' : 'anon'))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setStatus(s ? 'authed' : 'anon'))
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])
  if (status === 'loading') return <div className="p-6 text-white/70">Loading…</div>
  if (status === 'anon') return <Navigate to="/auth" replace state={{ from: loc }} />
  return <Outlet />
}

function RedirectIfAuthed({ children }) {
  const [status, setStatus] = useState('loading')
  useEffect(() => {
    let unsub
    supabase.auth.getSession().then(({ data: { session } }) => setStatus(session ? 'authed' : 'anon'))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setStatus(s ? 'authed' : 'anon'))
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])
  if (status === 'loading') return <div className="p-6 text-white/70">Loading…</div>
  if (status === 'authed') return <Navigate to="/app" replace />
  return children
}

/* --------------------------- Onboarding helpers -------------------------- */

// Only accept a true boolean from metadata; ignore 1/"true"/etc.
function strictMetaBoolean(meta) {
  for (const k of ['onboarding_complete', 'has_onboarded', 'onboarded']) {
    if (Object.prototype.hasOwnProperty.call(meta, k)) {
      if (typeof meta[k] === 'boolean') return meta[k]
      // anything else (number/string) is ignored to avoid accidental bypass
      return null
    }
  }
  return null
}

async function getOnboardingDecision() {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) return { authed: false }

  // 1) Metadata (strict)
  const meta = user.user_metadata || {}
  const metaFlag = strictMetaBoolean(meta)
  if (metaFlag !== null) return { authed: true, onboarded: metaFlag }

  // 2) Profiles row (strict)
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_complete, has_onboarded, onboarded, onboarding_completed_at')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      // If table truly doesn’t exist, don’t block legacy apps
      const msg = `${error.code || ''} ${error.message || ''}`
      if (/42P01/.test(msg) || /relation .* does not exist/i.test(msg)) {
        return { authed: true, onboarded: true }
      }
      // For permission or any other error, be strict: not onboarded
      return { authed: true, onboarded: false }
    }

    if (!data) return { authed: true, onboarded: false }

    const flag =
      data.onboarding_complete === true ||
      data.has_onboarded === true ||
      data.onboarded === true ||
      Boolean(data.onboarding_completed_at)

    return { authed: true, onboarded: flag }
  } catch {
    return { authed: true, onboarded: false }
  }
}

function AppEntryRouter() {
  const nav = useNavigate()
  useEffect(() => {
    let alive = true
    ;(async () => {
      const s = await supabase.auth.getSession()
      if (!s.data.session) { if (alive) nav('/auth', { replace: true }); return }
      const res = await getOnboardingDecision()
      if (!alive) return
      nav(res.onboarded ? '/home' : '/onboarding', { replace: true })
    })()
    return () => { alive = false }
  }, [nav])
  return <div className="p-6 text-white/70">Loading…</div>
}

function HomeGate({ children }) {
  const [state, setState] = useState('loading') // 'loading' | 'home' | 'onboarding'
  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await getOnboardingDecision()
      if (alive) setState(res.onboarded ? 'home' : 'onboarding')
    })()
    return () => { alive = false }
  }, [])
  if (state === 'loading') return <div className="p-6 text-white/70">Loading…</div>
  if (state === 'onboarding') return <Navigate to="/onboarding" replace />
  return children
}

function OnboardingGate() {
  const [state, setState] = useState('loading') // 'loading' | 'home' | 'onboarding'
  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await getOnboardingDecision()
      if (alive) setState(res.onboarded ? 'home' : 'onboarding')
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
      { path: 'auth', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'auth/sign-in', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'auth/sign-up', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'login', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'signup', element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed> },
      { path: 'signin', element: <Navigate to="/login" replace /> },
      { path: 'register', element: <Navigate to="/signup" replace /> },
      { path: 'auth/reset-password', element: <ResetPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'confirm-email', element: <ConfirmEmail /> },
      { path: 'logout', element: <SignOutRoute /> },
    ],
  },
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
          { path: 'home', element: (<HomeGate><HomePage /></HomeGate>) },
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
  { path: 'app', element: <AppEntryRouter /> },
  { path: 'app/*', element: <AppPrefixAliasStripper /> },
  { path: '*', element: <NotFound /> },
])