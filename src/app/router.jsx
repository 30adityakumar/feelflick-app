// src/app/router.jsx
import * as Sentry from '@sentry/react'
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

// Root shells
import AppShell from '@/app/AppShell'

// Public pages (no app chrome)
const Landing = lazy(() => import('@/features/landing/Landing'))

// App pages (with header/sidebar)
const HomePage = lazy(() => import('@/app/homepage/HomePage'))
const MoviesTab = lazy(() => import('@/app/pages/movies/MoviesTab'))
const MovieDetail = lazy(() => import('@/app/pages/MovieDetail'))
import ErrorBoundary from './ErrorBoundary'
const Onboarding = lazy(() => import('@/features/onboarding/Onboarding'))
const Account = lazy(() => import('@/app/header/components/Account'))
const Preferences = lazy(() => import('@/app/header/components/Preferences'))
const Watchlist = lazy(() => import('@/app/pages/watchlist/Watchlist'))
const HistoryPage = lazy(() => import('@/app/pages/watched/WatchedHistory'))
const MobileAccount = lazy(() => import('@/app/header/components/MobileAccount'))

// 404
const NotFound = lazy(() => import('@/app/pages/NotFound'))

// Shared top/bottom
import TopNav from '@/features/landing/components/TopNav'
import Footer from '@/features/landing/components/Footer'

// Auth/onboarding gate
import PostAuthGate from '@/features/auth/PostAuthGate'
const OAuthCallback = lazy(() => import('@/features/auth/OAuthCallback'))

// Import the new pages
const AboutPage = lazy(() => import('@/app/pages/legal/AboutPage'))
const PrivacyPage = lazy(() => import('@/app/pages/legal/PrivacyPage'))
const TermsPage = lazy(() => import('@/app/pages/legal/TermsPage'))

const DiscoverPage = lazy(() => import('@/app/pages/discover/DiscoverPage'))
const MoodBrowsePage = lazy(() => import('@/app/pages/browse/MoodBrowsePage'))
const CollectionPage = lazy(() => import('@/app/pages/browse/CollectionPage'))
const CuratedListsIndex = lazy(() => import('@/app/pages/browse/CuratedListsIndex'))
const CuratedListPage = lazy(() => import('@/app/pages/browse/CuratedListPage'))
const TasteProfile = lazy(() => import('@/app/pages/profile/TasteProfile'))
const PublicProfile = lazy(() => import('@/app/pages/profile/PublicProfile'))
const UserSearchPage = lazy(() => import('@/app/pages/people/UserSearchPage'))
const ListsPage = lazy(() => import('@/app/pages/lists/ListsPage'))
const ListDetailPage = lazy(() => import('@/app/pages/lists/ListDetailPage'))

// cache monitoring page
const CacheMonitoring = lazy(() => import('./admin/CacheMonitoring'))
import { normalizeAdminEmails, resolveAdminAccess } from './admin/access'
import { useAuthSession } from '@/shared/hooks/useAuthSession'


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

// Hero-shaped skeleton for /home — matches HeroTopPick + first two carousel rows so the
// Suspense swap produces zero layout shift on any viewport height. Uses animate-pulse, no spinner.
// WHY rows: on large displays (hero capped at 800px, viewport ≥900px) the first carousel row
// is partially visible. Without skeleton rows below the hero, Suspense swap reveals real carousel
// content and registers as CLS.
function HomeSkeleton() {
  return (
    <div aria-hidden="true">
      {/* Hero section — identical constraints to HeroTopPick's <section> */}
      <div
        className="relative w-full bg-black overflow-hidden"
        style={{ height: '75vh', minHeight: 500, maxHeight: 800 }}
      >
        {/* Backdrop placeholder */}
        <div className="absolute inset-0 animate-pulse bg-purple-500/[0.04]" />
        {/* Gradient overlays matching the real hero */}
        <div className="absolute bottom-0 inset-x-0 h-[65%] bg-gradient-to-t from-black via-black/75 to-transparent" />
        {/* Content area skeleton — bottom-anchored like the real hero */}
        <div className="absolute bottom-6 left-4 sm:left-6 lg:left-10 right-4 sm:right-6 lg:right-10 flex flex-col gap-3">
          <div className="h-3 w-28 rounded-full animate-pulse bg-purple-500/[0.08]" />
          <div className="h-8 w-2/3 sm:w-1/2 rounded-lg animate-pulse bg-white/[0.06]" />
          <div className="h-4 w-1/3 rounded-full animate-pulse bg-white/[0.04]" />
          <div className="flex gap-2 mt-1">
            <div className="h-9 w-28 rounded-full animate-pulse bg-purple-500/[0.12]" />
            <div className="h-9 w-9 rounded-full animate-pulse bg-white/[0.06]" />
            <div className="h-9 w-9 rounded-full animate-pulse bg-white/[0.06]" />
          </div>
        </div>
      </div>

      {/* Carousel row skeletons — occupy the space that TopOfYourTasteRow etc. will fill.
          Prevents any below-fold visible carousels from popping in as CLS. */}
      <div className="mx-auto max-w-[1600px] pb-24 sm:pb-32">
        {[0, 1].map(i => (
          <div key={i} className="px-4 sm:px-6 pt-10 pb-4">
            {/* Section header — matches the global section header pattern */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-[3px] h-5 rounded-full animate-pulse bg-purple-500/[0.12]" />
              <div className="h-4 w-44 rounded-full animate-pulse bg-white/[0.06]" />
            </div>
            {/* Card row — 5 poster-aspect placeholders at standard carousel card width */}
            <div className="flex gap-3 overflow-hidden">
              {[0, 1, 2, 3, 4].map(j => (
                <div
                  key={j}
                  className="flex-none rounded-lg animate-pulse bg-white/[0.04]"
                  style={{ width: 148, height: 222 }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LazyRoute({ Component }) {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <Component />
    </Suspense>
  )
}

function HomeRoute() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomePage />
    </Suspense>
  )
}

/** Root entry: if authed → /home, otherwise show Landing */
function RootEntry() {
  const { ready, isAuthenticated } = useAuthSession()

  if (!ready) return <FullScreenSpinner />
  if (isAuthenticated) return <Navigate to="/home" replace />
  return <LazyRoute Component={Landing} />
}

/* ------------------------------ Auth guards ------------------------------ */
function RequireAuth() {
  const { ready, isAuthenticated } = useAuthSession()
  const loc = useLocation()

  if (!ready) return <FullScreenSpinner />
  if (!isAuthenticated) return <Navigate to="/" replace state={{ from: loc }} />
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

/* ------------------------------ Admin guard ------------------------------ */
const ADMIN_EMAILS = normalizeAdminEmails(import.meta.env.VITE_ADMIN_EMAILS || '')

function AdminOnly() {
  const { ready, session } = useAuthSession()
  const loc = useLocation()

  const status = ready ? resolveAdminAccess(session, ADMIN_EMAILS) : 'loading'

  if (status === 'loading') return <FullScreenSpinner />
  if (status === 'anon') return <Navigate to="/" replace state={{ from: loc }} />
  if (status === 'unconfigured') return (
    <div className="grid min-h-[60vh] place-items-center text-white/60 text-sm px-4 text-center">
      Admin access is not configured for this environment. Please contact the team administrator.
    </div>
  )
  if (status === 'forbidden') return (
    <div className="grid min-h-[60vh] place-items-center text-white/60 text-sm">
      You do not have permission to view this page.
    </div>
  )
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
    supabase.auth.signOut().finally(() => nav('/', { replace: true }))
  }, [nav])
  return <FullScreenSpinner />
}

/* -------------------------------- Router --------------------------------- */
const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouterV7(createBrowserRouter)

export const router = sentryCreateBrowserRouter([
  // Public branch (no app chrome)
  {
    element: <PublicShell />,
    errorElement: <ErrorBoundary />,
    children: [
      // Root decides: Landing (anon) or /home (authed)
      { index: true, element: <RootEntry /> },

      // OAuth callback route - MUST come before legacy auth redirects
      { path: 'auth/callback', element: <LazyRoute Component={OAuthCallback} /> },

      // Legal pages (publicly accessible)
      { path: 'about', element: <LazyRoute Component={AboutPage} /> },
      { path: 'privacy', element: <LazyRoute Component={PrivacyPage} /> },
      { path: 'terms', element: <LazyRoute Component={TermsPage} /> },

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
            element: <LazyRoute Component={Onboarding} />,
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
      { path: 'movies', element: <LazyRoute Component={MoviesTab} />, errorElement: <ErrorBoundary /> },
      { path: 'movie/:id', element: <LazyRoute Component={MovieDetail} />, errorElement: <ErrorBoundary /> },
      { path: 'browse', element: <LazyRoute Component={MoviesTab} />, errorElement: <ErrorBoundary /> },
      { path: 'trending', element: <LazyRoute Component={MoviesTab} />, errorElement: <ErrorBoundary /> },
      { path: 'discover', element: <LazyRoute Component={DiscoverPage} />, errorElement: <ErrorBoundary /> },
      { path: 'mood/:tag', element: <LazyRoute Component={MoodBrowsePage} />, errorElement: <ErrorBoundary /> },
      { path: 'tone/:tag', element: <LazyRoute Component={MoodBrowsePage} />, errorElement: <ErrorBoundary /> },
      { path: 'browse/fit/:profile', element: <LazyRoute Component={MoodBrowsePage} />, errorElement: <ErrorBoundary /> },
      { path: 'collection/:id', element: <LazyRoute Component={CollectionPage} />, errorElement: <ErrorBoundary /> },
      { path: 'lists/curated', element: <LazyRoute Component={CuratedListsIndex} />, errorElement: <ErrorBoundary /> },
      { path: 'lists/curated/:slug', element: <LazyRoute Component={CuratedListPage} />, errorElement: <ErrorBoundary /> },
      { path: 'lists/:listId', element: <LazyRoute Component={ListDetailPage} />, errorElement: <ErrorBoundary /> },

      // Admin-only routes (auth + email allowlist)
      {
        element: <AdminOnly />,
        errorElement: <ErrorBoundary />,
        children: [
          { path: 'admin/cache-monitoring', element: <LazyRoute Component={CacheMonitoring} />, errorElement: <ErrorBoundary /> },
        ],
      },

      // Auth-required + onboarding gate
      {
        element: <RequireAuth />,
        errorElement: <ErrorBoundary />,
        children: [
          {
            element: <PostAuthGate />,
            errorElement: <ErrorBoundary />,
            children: [
              { path: 'home', element: <HomeRoute />, errorElement: <ErrorBoundary /> },
              { path: 'account', element: <LazyRoute Component={Account} />, errorElement: <ErrorBoundary /> },
              { path: 'preferences', element: <LazyRoute Component={Preferences} />, errorElement: <ErrorBoundary /> },
              { path: 'watchlist', element: <LazyRoute Component={Watchlist} />, errorElement: <ErrorBoundary /> },
              { path: 'watched', element: <LazyRoute Component={HistoryPage} />, errorElement: <ErrorBoundary /> },
              { path: 'history', element: <LazyRoute Component={HistoryPage} />, errorElement: <ErrorBoundary /> },
              { path: 'mobile-account', element: <LazyRoute Component={MobileAccount} />, errorElement: <ErrorBoundary /> },
              { path: 'profile', element: <LazyRoute Component={TasteProfile} />, errorElement: <ErrorBoundary /> },
              { path: 'profile/:userId', element: <LazyRoute Component={PublicProfile} />, errorElement: <ErrorBoundary /> },
              { path: 'people', element: <LazyRoute Component={UserSearchPage} />, errorElement: <ErrorBoundary /> },
              { path: 'lists', element: <LazyRoute Component={ListsPage} />, errorElement: <ErrorBoundary /> },
              // Confirmed unfinished — redirect until shipped
              { path: 'feed', element: <Navigate to="/home" replace /> },
              { path: 'challenges', element: <Navigate to="/home" replace /> },

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
  { path: '*', element: <LazyRoute Component={NotFound} />, errorElement: <ErrorBoundary /> },
])
