// src/features/auth/PostAuthGate.jsx
import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'

/**
 * Post-Auth Gate Component
 *
 * Routes authenticated users based on onboarding status:
 * - Not authenticated → redirect to landing (/)
 * - Authenticated + onboarding incomplete → redirect to /onboarding
 * - Authenticated + onboarding complete → allow access
 * - On /onboarding when complete → redirect to /home
 *
 * Prevents the "home page flash" by showing a spinner during verification
 */

const isStrictTrue = (v) => v === true

function SplashSpinner() {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-gradient-to-br from-[#0a121a] via-[#0d1722] to-[#0c1017]">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '1s' }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        <svg
          className="h-12 w-12 animate-spin text-purple-400"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="4" />
          <path d="M21 12a9 9 0 0 0-9-9v9z" fill="currentColor" />
        </svg>
        <span className="text-lg font-semibold text-white/90">Loading your profile...</span>
      </div>
    </div>
  )
}

export default function PostAuthGate({ standalone = false }) {
  const [state, setState] = useState('checking') // 'checking' | 'ready'
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [hasUser, setHasUser] = useState(null) // null | boolean
  const location = useLocation()

  useEffect(() => {
    let mounted = true
    let checkTimeout

    async function verifySession({ forceDbCheck = false } = {}) {
      try {
        console.log('[PostAuthGate] Verifying session (fast path)...')

        // FAST PATH: cached session (no network call in the common case)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (!mounted) return

        if (sessionError || !session) {
          console.log('[PostAuthGate] No authenticated session')
          setHasUser(false)
          setIsOnboarded(false)
          setState('ready')
          return
        }

        const user = session.user
        console.log('[PostAuthGate] Session found for user:', user?.id)
        setHasUser(true)

        // TRUST METADATA FIRST (no DB query needed on normal loads)
        const meta = user?.user_metadata || {}

        const hasOnboardingMetadata =
          Object.prototype.hasOwnProperty.call(meta, 'onboarding_complete') ||
          Object.prototype.hasOwnProperty.call(meta, 'has_onboarded') ||
          Object.prototype.hasOwnProperty.call(meta, 'onboarded')

        const metadataComplete =
          isStrictTrue(meta.onboarding_complete) ||
          isStrictTrue(meta.has_onboarded) ||
          isStrictTrue(meta.onboarded)

        // If metadata exists and we are not forcing DB validation, trust it.
        if (!forceDbCheck && hasOnboardingMetadata) {
          console.log('[PostAuthGate] Onboarding status (metadata):', metadataComplete)
          setIsOnboarded(metadataComplete)
          setState('ready')
          return
        }

        // Rare edge case: metadata missing (or we explicitly want to re-check)
        console.log('[PostAuthGate] Falling back to database check (metadata missing/forced)')

        const { data, error } = await supabase
          .from('users')
          .select('onboarding_complete,onboarding_completed_at')
          .eq('id', user.id)
          .maybeSingle()

        if (!mounted) return

        if (error) {
          console.warn('[PostAuthGate] Database check error:', error)
          setIsOnboarded(false)
          setState('ready')
          return
        }

        const dbComplete =
          isStrictTrue(data?.onboarding_complete) ||
          Boolean(data?.onboarding_completed_at)

        console.log('[PostAuthGate] Onboarding status (database):', dbComplete)
        setIsOnboarded(dbComplete)
        setState('ready')

        // If DB says complete, ensure metadata is aligned for future fast loads
        if (dbComplete && !metadataComplete) {
          console.log('[PostAuthGate] Syncing metadata with database')
          try {
            await supabase.auth.updateUser({
              data: { onboarding_complete: true, has_onboarded: true, onboarded: true }
            })
          } catch (e) {
            console.warn('[PostAuthGate] Metadata sync failed (non-blocking):', e)
          }
        }
      } catch (err) {
        console.error('[PostAuthGate] Verification error:', err)
        if (mounted) {
          setIsOnboarded(false)
          setState('ready')
        }
      }
    }

    // If coming from onboarding, prefer correctness over speed:
    // add a short delay + force DB check to avoid stale/propagation race conditions.
    if (location.state?.fromOnboarding) {
      console.log('[PostAuthGate] Coming from onboarding, forcing DB verification after short delay')
      checkTimeout = setTimeout(() => {
        verifySession({ forceDbCheck: true })
      }, 800)
    } else {
      verifySession()
    }

    return () => {
      mounted = false
      if (checkTimeout) clearTimeout(checkTimeout)
    }
  }, [location.state?.fromOnboarding])

  // Show loading spinner while checking
  if (state === 'checking') {
    return standalone ? (
      <div className="relative min-h-screen">
        <div aria-hidden="true" className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
        </div>
        <SplashSpinner />
      </div>
    ) : (
      <SplashSpinner />
    )
  }

  // Not authenticated → redirect to landing
  if (hasUser === false) {
    return <Navigate to="/" replace />
  }

  // Authenticated but onboarding incomplete → redirect to onboarding
  if (!isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace state={{ from: location }} />
  }

  // Authenticated and onboarded, but on onboarding page → redirect to home
  if (isOnboarded && location.pathname === '/onboarding') {
    return <Navigate to="/home" replace />
  }

  // All checks passed → render nested route
  return <Outlet />
}
