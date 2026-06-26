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
const Home = lazy(() => import('@/features/home/Home'))
const Browse = lazy(() => import('@/features/browse/Browse'))
const MovieDetail = lazy(() => import('@/features/movie/MovieDetail'))
import ErrorBoundary from './ErrorBoundary'
const Onboarding = lazy(() => import('@/features/onboarding/Onboarding'))
const Account = lazy(() => import('@/features/account/Account'))
const Preferences = lazy(() => import('@/features/preferences/Preferences'))
const Watchlist = lazy(() => import('@/features/watchlist/Watchlist'))
const History = lazy(() => import('@/features/history/History'))

// 404
const NotFound = lazy(() => import('@/app/NotFound'))

// Stage 1 — Thoughtful Seatmate foundations showcase (DEV-ONLY). The literal
// `import.meta.env.DEV` guard + static import path let Rollup dead-code-eliminate
// both this lazy import and its route from the production build (no prod chunk, no
// user-accessible route). Not a normal route; for foundation review in dev only.
const Stage1Foundations = import.meta.env.DEV
  ? lazy(() => import('@/features/design-lab/thoughtful-seatmate-foundations/Showcase'))
  : null

// Shared top/bottom nav + footer (used by legal pages)
import TopNav from '@/components/layout/TopNav'
import Footer from '@/components/layout/Footer'

// Auth/onboarding gate
import PostAuthGate from '@/features/auth/PostAuthGate'
import BetaAccessGate from '@/features/auth/BetaAccessGate'
const OAuthCallback = lazy(() => import('@/features/auth/OAuthCallback'))

// Import the new pages
const About = lazy(() => import('@/features/legal/About'))
const Privacy = lazy(() => import('@/features/legal/Privacy'))
const Terms = lazy(() => import('@/features/legal/Terms'))

const Discover = lazy(() => import('@/features/discover/Discover'))
const ShareStudio = lazy(() => import('@/features/share/ShareCard'))
const MoodBrowse = lazy(() => import('@/features/browse/MoodBrowse'))
const Collection = lazy(() => import('@/features/browse/Collection'))
const TasteProfile = lazy(() => import('@/features/profile/TasteProfile'))
const People = lazy(() => import('@/features/people/People'))
const Lists = lazy(() => import('@/features/lists/Lists'))
const ListDetail = lazy(() => import('@/features/lists/ListDetail'))
const CuratedList = lazy(() => import('@/features/lists/CuratedList'))
const PersonalList = lazy(() => import('@/features/lists/PersonalList'))

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
// Generic dark skeleton for Suspense / auth-gate fallbacks. Matches the
// CLAUDE.md "Never spinners" rule — a content-shaped pulse, not an indicator.
// Per-route surfaces should provide their own skeleton.
function RouteSkeleton() {
  return (
    <div className="min-h-[60vh] px-4 sm:px-6 lg:px-10 py-10" aria-hidden="true">
      <div className="mx-auto max-w-[1280px] flex flex-col gap-6">
        {/* Eyebrow + title */}
        <div className="flex items-center gap-2.5">
          <div className="w-[3px] h-5 rounded-full animate-pulse bg-purple-500/12" />
          <div className="h-4 w-44 rounded-full animate-pulse bg-white/6" />
        </div>
        <div className="h-12 w-2/3 rounded-lg animate-pulse bg-white/6" />
        <div className="h-4 w-1/2 rounded-full animate-pulse bg-white/4" />
        {/* Card row placeholder */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-6">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-2/3 rounded-lg animate-pulse bg-purple-500/4" />
          ))}
        </div>
      </div>
    </div>
  )
}


function LazyRoute({ Component }) {
  return (
    <Suspense fallback={<RouteSkeleton />}>
      <Component />
    </Suspense>
  )
}


/** Root entry: if authed → /home, otherwise show Landing */
function RootEntry() {
  const { ready, isAuthenticated } = useAuthSession()

  if (!ready) return <RouteSkeleton />
  if (isAuthenticated) return <Navigate to="/home" replace />
  return <LazyRoute Component={Landing} />
}

/* ------------------------------ Auth guards ------------------------------ */
function RequireAuth() {
  const { ready, isAuthenticated } = useAuthSession()
  const loc = useLocation()

  if (!ready) return <RouteSkeleton />
  if (!isAuthenticated) return <Navigate to="/" replace state={{ from: loc }} />
  return <Outlet />
}

/* ------------------------ Auth-style chrome (bg) ------------------------- */
function LandingBg() {
  return (
    <div aria-hidden className="fixed inset-0 z-0">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
      {/* Brand ambient (F3): purple-600 + pink-500 blobs — were off-brand
          orange/red-orange. Same blur/size/position/opacity; hue only. */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-50 bg-[radial-gradient(closest-side,rgba(147,51,234,0.45),rgba(147,51,234,0)_70%)]" />
      <div className="pointer-events-none absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(236,72,153,0.38),rgba(236,72,153,0)_70%)]" />
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

  if (status === 'loading') return <RouteSkeleton />
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
  return <RouteSkeleton />
}

/* -------------------------------- Router --------------------------------- */
const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouterV7(createBrowserRouter)

export const router = sentryCreateBrowserRouter([
  // Root: Landing (anon) or /home (authed). Deliberately a TOP-LEVEL route OUTSIDE
  // PublicShell so the anonymous Landing owns its own <header>/<main id="main">/
  // <footer> as siblings — not nested inside PublicShell's <main> (the prior
  // landmark-nesting issue). RootEntry still gates auth-ready / authed-redirect.
  { path: '/', element: <RootEntry />, errorElement: <ErrorBoundary /> },

  // /about: a TOP-LEVEL route (outside PublicShell), like Landing, so the rebuilt
  // marketing page owns its own <header>/<main id="main">/<footer> as siblings (shared
  // SiteHeaderHost + LandingFooter) rather than nesting inside PublicShell's <main>.
  { path: '/about', element: <LazyRoute Component={About} />, errorElement: <ErrorBoundary /> },

  // Public branch (no app chrome) — legal/callback/share/aliases keep PublicShell's <main>.
  {
    element: <PublicShell />,
    errorElement: <ErrorBoundary />,
    children: [
      // DEV-ONLY Stage 1 foundations showcase — empty in production (tree-shaken).
      ...(import.meta.env.DEV
        ? [{ path: 'design-lab/thoughtful-seatmate-foundations', element: <LazyRoute Component={Stage1Foundations} />, errorElement: <ErrorBoundary /> }]
        : []),

      // OAuth callback route - MUST come before legacy auth redirects
      { path: 'auth/callback', element: <LazyRoute Component={OAuthCallback} /> },

      // Legal pages (publicly accessible)
      { path: 'privacy', element: <LazyRoute Component={Privacy} /> },
      { path: 'terms', element: <LazyRoute Component={Terms} /> },

      // Share Studio — downloadable "Tonight's Pick" card (demo data for now)
      { path: 'share', element: <LazyRoute Component={ShareStudio} /> },

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
          },
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
      { path: 'movies', element: <Navigate to="/browse" replace /> },
      { path: 'movie/:id', element: <LazyRoute Component={MovieDetail} />, errorElement: <ErrorBoundary /> },
      { path: 'browse', element: <LazyRoute Component={Browse} />, errorElement: <ErrorBoundary /> },
      { path: 'trending', element: <Navigate to="/browse" replace /> },
      { path: 'discover', element: <LazyRoute Component={Discover} />, errorElement: <ErrorBoundary /> },
      { path: 'mood/:tag', element: <LazyRoute Component={MoodBrowse} />, errorElement: <ErrorBoundary /> },
      { path: 'tone/:tag', element: <LazyRoute Component={MoodBrowse} />, errorElement: <ErrorBoundary /> },
      { path: 'browse/fit/:profile', element: <LazyRoute Component={MoodBrowse} />, errorElement: <ErrorBoundary /> },
      { path: 'collection/:id', element: <LazyRoute Component={Collection} />, errorElement: <ErrorBoundary /> },
      { path: 'lists/curated/:slug', element: <LazyRoute Component={CuratedList} />, errorElement: <ErrorBoundary /> },
      { path: 'lists/personal/:type', element: <LazyRoute Component={PersonalList} />, errorElement: <ErrorBoundary /> },
      { path: 'lists/:listId', element: <LazyRoute Component={ListDetail} />, errorElement: <ErrorBoundary /> },

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
              // B1.4 private-beta gate. Transparent pass-through unless VITE_ENABLE_BETA_GATE is on
              // (default off → no change for dev/CI/current users). Gates only the authenticated app
              // surfaces below — never legal/auth/public-catalog/public-list routes.
              {
                element: <BetaAccessGate />,
                errorElement: <ErrorBoundary />,
                children: [
                  { path: 'home', element: <LazyRoute Component={Home} />, errorElement: <ErrorBoundary /> },
                  { path: 'account', element: <LazyRoute Component={Account} />, errorElement: <ErrorBoundary /> },
                  { path: 'preferences', element: <LazyRoute Component={Preferences} />, errorElement: <ErrorBoundary /> },
                  { path: 'watchlist', element: <LazyRoute Component={Watchlist} />, errorElement: <ErrorBoundary /> },
                  { path: 'history', element: <LazyRoute Component={History} />, errorElement: <ErrorBoundary /> },
                  { path: 'watched', element: <LazyRoute Component={History} />, errorElement: <ErrorBoundary /> },
                  { path: 'profile', element: <LazyRoute Component={TasteProfile} />, errorElement: <ErrorBoundary /> },
                  { path: 'profile/:userId', element: <LazyRoute Component={TasteProfile} />, errorElement: <ErrorBoundary /> },
                  { path: 'people', element: <LazyRoute Component={People} />, errorElement: <ErrorBoundary /> },
                  { path: 'lists', element: <LazyRoute Component={Lists} />, errorElement: <ErrorBoundary /> },
                  // Confirmed unfinished — redirect until shipped
                  { path: 'feed', element: <Navigate to="/home" replace /> },
                  { path: 'challenges', element: <Navigate to="/home" replace /> },
                ],
              },
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
