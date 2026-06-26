// src/app/AppShell.jsx
import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from '@/app/header/components/BottomNav'
import SiteHeaderHost from '@/app/header/SiteHeaderHost'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePendingDeletion } from '@/shared/hooks/usePendingDeletion'
import { identify, resetAnalytics, track } from '@/shared/services/analytics'
import { redactPath } from '@/shared/services/betaEvents'

export default function AppShell() {
  const location = useLocation()
  const { user, isAuthenticated } = useAuthSession()

  // Reset scroll + track page view on route change. (Header visibility + the
  // global search live in SiteHeaderHost, shared with the anonymous Landing.)
  useEffect(() => {
    // B1.4: redact dynamic path segments (/profile/:id, /lists/:id, /movie/:id …) so no real
    // user/content id ever reaches analytics in the page path.
    track('page_viewed', { path: redactPath(location.pathname) })

    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }, [location.pathname])

  // Identify / reset on auth state change
  const prevUserIdRef = useRef(null)
  useEffect(() => {
    const uid = user?.id ?? null
    if (uid && uid !== prevUserIdRef.current) {
      // B1.2: identify by stable id ONLY — never email/name (no PII to PostHog).
      identify(uid)
    } else if (!uid && prevUserIdRef.current) {
      resetAnalytics()
    }
    prevUserIdRef.current = uid
  }, [user])

  return (
    <div className="relative min-h-screen text-white">
      {/* Page background */}
      <div aria-hidden className="fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: 'var(--color-canvas, #15120f)' }} />
      </div>

      {/* Shared fixed header + global search — the same host the anonymous Landing
          renders, so there is one header implementation, not a copied variant. */}
      <SiteHeaderHost />

      {/* Page content. Authenticated routes reserve space for the mobile BottomNav
          (~85px + safe-area). Anonymous app routes have no bottom bar, so they no
          longer reserve mobile bottom space. */}
      <main
        className={`relative z-10 w-full ${isAuthenticated ? 'pb-28 md:pb-0' : ''}`}
        style={{ paddingTop: 'var(--hdr-h, 56px)' }}
      >
        <Outlet />
      </main>

      {/* Mobile bottom navigation — authenticated users only. Anonymous users have
          no bottom bar; their Search + Sign in live in the shared top header. */}
      {isAuthenticated && <BottomNav />}

      {/* Pending-deletion banner — only when authed AND a request exists. */}
      {isAuthenticated && <PendingDeletionBanner />}

      {/* Loading indicator for route transitions */}
      <RouteLoadingIndicator />
    </div>
  )
}

/**
 * Top banner shown on every authed page if the user has scheduled their
 * account for deletion. Lets them cancel without navigating to /account.
 */
function PendingDeletionBanner() {
  const { pendingDeletion, cancel } = usePendingDeletion()
  const [busy, setBusy] = useState(false)
  if (!pendingDeletion?.scheduled_for) return null
  const scheduled = new Date(pendingDeletion.scheduled_for).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-[60]"
      style={{
        background: 'rgba(239,68,68,0.92)',
        color: '#fff',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontFamily: 'Inter, sans-serif',
        fontSize: 13,
        flexWrap: 'wrap',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span>
        Account scheduled for deletion on <strong style={{ fontWeight: 700 }}>{scheduled}</strong>.
      </span>
      <button
        type="button"
        onClick={async () => { try { setBusy(true); await cancel() } finally { setBusy(false) } }}
        disabled={busy}
        style={{
          padding: '6px 14px',
          borderRadius: 4,
          background: '#fff',
          color: '#b91c1c',
          border: 'none',
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: busy ? 'wait' : 'pointer',
          opacity: busy ? 0.7 : 1,
        }}
      >{busy ? 'Cancelling…' : 'Cancel deletion'}</button>
    </div>
  )
}

/**
 * Shows a subtle loading indicator during route transitions
 * Apple-inspired, minimal, non-intrusive
 */
function RouteLoadingIndicator() {
  const [loading, setLoading] = useState(false)
  const location = useLocation()
  const timeoutRef = useRef(null)
  const clearTimeoutRef = useRef(null)

  useEffect(() => {
    // Clear any existing timeouts
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current)
    }

    // Show loading indicator after a short delay (avoid flash for fast loads)
    setLoading(false) // Reset first
    timeoutRef.current = setTimeout(() => {
      setLoading(true)
    }, 200)

    // Hide loading indicator after route change completes
    clearTimeoutRef.current = setTimeout(() => {
      setLoading(false)
    }, 1000) // Adjust this duration as needed

    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current)
    }
  }, [location.pathname])

  if (!loading) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 z-[100] overflow-hidden"
      role="progressbar"
      aria-label="Loading page"
    >
      <div className="feelflick-route-progress h-full" style={{ background: 'var(--color-brand-rose, #dd4e83)' }} />
    </div>
  )
}
