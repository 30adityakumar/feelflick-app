// src/app/router.jsx
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

// Public pages (no app chrome)
import Landing from '@/features/landing/Landing'

// App pages (with header/sidebar)
import HomePage from '@/app/homepage/HomePage'
import MoviesTab from '@/app/pages/movies/MoviesTab'
import MovieDetail from '@/app/pages/MovieDetail'
import ErrorBoundary from './ErrorBoundary'
import Onboarding from '@/features/onboarding/Onboarding'
import Account from '@/app/header/components/Account'
import Preferences from '@/app/header/components/Preferences'
import Watchlist from '@/app/pages/watchlist/Watchlist'
import HistoryPage from '@/app/pages/watched/WatchedHistory'
import MobileAccount from '@/app/header/components/MobileAccount'

// 404
import NotFound from '@/app/pages/NotFound'

// Shared top/bottom
import TopNav from '@/features/landing/components/TopNav'
import Footer from '@/features/landing/components/Footer'

// Auth/onboarding gate
import PostAuthGate from '@/features/auth/PostAuthGate'
import OAuthCallback from '@/features/auth/OAuthCallback'

// Import the new pages
import AboutPage from '@/app/pages/legal/AboutPage'
import PrivacyPage from '@/app/pages/legal/PrivacyPage'
import TermsPage from '@/app/pages/legal/TermsPage'

// Test recommendations page
import TestRecommendations from '@/app/pages/TestRecommendations'

import DiscoverPage from '@/app/pages/discover/DiscoverPage'

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

/* ------------------------------ Small UI bits ---------------------------- */
function FullScreenSpinner() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-white/80">
      <div className="inline-flex items-center gap-3">
        <svg className="h-6 w-6 animate-spin text-brand-100" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="4" />
          <path d="M4 12a8 8 0 018-8v8z" fill="currentColor" />
        </svg>
        <span>Loading…</span>
      </div>
    </div>
  )
}

/** Root entry: if authed → /home, otherwise show Landing */
function RootEntry() {
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

  if (status === 'loading') return <FullScreenSpinner />
  if (status === 'authed') return <Navigate to="/home" replace />
  return <Landing />
}

/* ------------------------------ Auth guards ------------------------------ */
function RequireAuth() {
  const [status, setStatus] = useState('loading')
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

  if (status === 'loading') return <FullScreenSpinner />
  if (status === 'anon') return <Navigate to="/" replace state={{ from: loc }} />
  return <Outlet />
}

/* ------------------------ Auth-style chrome (bg) ------------------------- */
function LandingBg() {
  return (
    <div aria-hidden className="fixed inset-0 z-0">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
      <div className="pointer-events-none absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-50 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),rgba(254,146,69,0)_70%)]" />
      <div className="pointer-events-none absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),rgba(235,66,59,0)_70%)]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(139,92,246,0.35),rgba(139,92,246,0)_70%)]" />
      <div className="pointer-events-none absolute -top-24 right-[15%] h-[45vmin] w-[45vmin] rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(255,99,196,0.35),rgba(255,99,196,0)_70%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen">
        <div className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_220deg_at_50%_50%,rgba(255,255,255,0.08),rgba(255,255,255,0)_65%)] motion-safe:lg:animate-[spin_48s_linear_infinite]" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.08),rgba(255,255,255,0)_60%)]" />
    </div>
  )
}

function OnboardingShell() {
  return (
    <>
      <TopNav hideAuthCta />
      <main id="main" className="relative mx-auto w-full min-h-screen" style={{ minHeight: '100dvh' }}>
        <LandingBg />
        <div className="relative z-10 flex flex-col h-full">
          <section className="flex-1 flex flex-col overflow-y-auto">
            <Outlet />
          </section>
          <div aria-hidden />
        </div>
      </main>
      <Footer />
    </>
  )
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
    supabase.auth.signOut().finally(() => nav('/', { replace: true }))
  }, [nav])
  return <FullScreenSpinner />
}

/* -------------------------------- Router --------------------------------- */
export const router = createBrowserRouter([
  // Public branch (no app chrome)
  {
    element: <PublicShell />,
    errorElement: <ErrorBoundary />,
    children: [
      // Root decides: Landing (anon) or /home (authed)
      { index: true, element: <RootEntry /> },

      // OAuth callback route - MUST come before legacy auth redirects
      { path: 'auth/callback', element: <OAuthCallback /> },

      // Legal pages (publicly accessible)
      { path: 'about', element: <AboutPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'terms', element: <TermsPage /> },

      // Legacy auth aliases → just go to root
      { path: 'auth', element: <Navigate to="/" replace /> },
      { path: 'auth/sign-in', element: <Navigate to="/" replace /> },
      { path: 'auth/sign-up', element: <Navigate to="/" replace /> },
      { path: 'auth/log-in-or-create-account', element: <Navigate to="/" replace /> },
      { path: 'login', element: <Navigate to="/" replace /> },
      { path: 'signup', element: <Navigate to="/" replace /> },
      { path: 'signin', element: <Navigate to="/" replace /> },
      { path: 'register', element: <Navigate to="/" replace /> },

      { path: 'logout', element: <SignOutRoute /> },
    ],
  },

  // Onboarding — auth required, but NO app chrome
  {
    element: <OnboardingShell />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <RequireAuth />,
        errorElement: <ErrorBoundary />,
        children: [
          { 
            path: 'onboarding', 
            element: <Onboarding />,
            errorElement: <ErrorBoundary />
          }
        ],
      },
    ],
  },

  // App branch (header + sidebar chrome)
  {
    element: <AppShell />,
    errorElement: <ErrorBoundary />,
    children: [
      // Publicly viewable
      { path: 'movies', element: <MoviesTab />, errorElement: <ErrorBoundary /> },
      { path: 'movie/:id', element: <MovieDetail />, errorElement: <ErrorBoundary /> },
      { path: 'browse', element: <MoviesTab />, errorElement: <ErrorBoundary /> },
      { path: 'trending', element: <MoviesTab />, errorElement: <ErrorBoundary /> },
      { path: 'discover', element: <DiscoverPage />, errorElement: <ErrorBoundary /> },

      // Auth-required + onboarding gate
      {
        element: <RequireAuth />,
        errorElement: <ErrorBoundary />,
        children: [
          {
            element: <PostAuthGate />,
            errorElement: <ErrorBoundary />,
            children: [
              { path: 'home', element: <HomePage />, errorElement: <ErrorBoundary /> },
              { path: 'account', element: <Account />, errorElement: <ErrorBoundary /> },
              { path: 'preferences', element: <Preferences />, errorElement: <ErrorBoundary /> },
              { path: 'watchlist', element: <Watchlist />, errorElement: <ErrorBoundary /> },
              { path: 'watched', element: <HistoryPage />, errorElement: <ErrorBoundary /> },
              { path: 'history', element: <HistoryPage />, errorElement: <ErrorBoundary /> },
              { path: 'mobile-account', element: <MobileAccount />, errorElement: <ErrorBoundary /> },
              { path: 'test-recommendations', element: <TestRecommendations />, errorElement: <ErrorBoundary /> },
            
              
            ],
          },
        ],
      },
    ],
  },

  // /app legacy alias
  { path: 'app', element: <AppPrefixAlias />, errorElement: <ErrorBoundary /> },
  { path: 'app/*', element: <AppPrefixAlias />, errorElement: <ErrorBoundary /> },

  // 404
  { path: '*', element: <NotFound />, errorElement: <ErrorBoundary /> },
])
