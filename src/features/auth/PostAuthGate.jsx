// src/features/auth/PostAuthGate.jsx
import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'

const isStrictTrue = (v) => v === true

/* --------------------------- Loading Spinner --------------------------- */
function SplashSpinner() {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]">
      {/* Background orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 h-[50vmin] w-[50vmin] rounded-full blur-3xl opacity-30 bg-[radial-gradient(closest-side,rgba(168,85,247,0.3),rgba(168,85,247,0)_70%)]" />
        <div className="absolute -bottom-44 -right-44 h-[60vmin] w-[60vmin] rounded-full blur-3xl opacity-40 bg-[radial-gradient(closest-side,rgba(236,72,153,0.25),rgba(236,72,153,0)_70%)]" />
      </div>
      {/* Spinner content */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Brand logo */}
        <div className="mb-2">
          <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
            FEELFLICK
          </span>
        </div>
        <div className="flex items-center gap-3 text-white/90">
          <svg
            className="h-5 w-5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeOpacity=".25"
              strokeWidth="4"
            />
            <path d="M21 12a9 9 0 0 0-9-9v9z" fill="currentColor" />
          </svg>
          <span className="text-sm font-medium">Setting up your experience…</span>
        </div>
      </div>
    </div>
  )
}

/* --------------------------- Error State --------------------------- */
function ErrorState({ onRetry }) {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]">
      <div className="relative z-10 flex flex-col items-center gap-4 px-4 text-center">
        <div className="mb-2">
          <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
            FEELFLICK
          </span>
        </div>
        <div className="max-w-md space-y-4">
          <p className="text-lg text-white/90 font-semibold">
            Something went wrong
          </p>
          <p className="text-sm text-white/70">
            We couldn't verify your account. This usually happens due to a network issue.
          </p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:from-purple-500 hover:to-amber-500 transition-all active:scale-95 shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}

/* --------------------------- Main Gate Component --------------------------- */
export default function PostAuthGate({ standalone = false }) {
  const [state, setState] = useState('checking') // 'checking' | 'ready' | 'error'
  const [done, setDone] = useState(false) // Onboarding completion status
  const [hasUser, setHasUser] = useState(null) // null | boolean
  const [retryCount, setRetryCount] = useState(0)
  const loc = useLocation()

  // Skip check if user just completed onboarding
  const skipCheck = loc.state?.fromOnboarding === true
  if (skipCheck) {
    return <Outlet />
  }

  useEffect(() => {
    let mounted = true
    const checkUserStatus = async () => {
      try {
        // Step 1: Auth
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (!mounted) return
        if (userError) {
          setState('error')
          return
        }
        if (!user) {
          setHasUser(false)
          setDone(false)
          setState('ready')
          return
        }
        setHasUser(true)

        // Step 2: Metadata
        const meta = user.user_metadata || {}
        const metadataComplete =
          isStrictTrue(meta.onboarding_complete) ||
          isStrictTrue(meta.has_onboarded) ||
          isStrictTrue(meta.onboarded)
        if (metadataComplete) {
          setDone(true)
          setState('ready')
          return
        }

        // Step 3: DB
        const { data, error: dbError } = await supabase
          .from('users')
          .select('onboarding_complete,onboarding_completed_at')
          .eq('id', user.id)
          .maybeSingle()
        if (!mounted) return
        if (dbError) {
          setDone(false)
          setState('ready')
          return
        }
        const dbComplete =
          isStrictTrue(data?.onboarding_complete) ||
          Boolean(data?.onboarding_completed_at)
        setDone(dbComplete)
        setState('ready')
      } catch (error) {
        if (mounted) setState('error')
      }
    }
    checkUserStatus()
    return () => { mounted = false }
  }, [retryCount])

  const handleRetry = () => {
    setState('checking')
    setRetryCount((prev) => prev + 1)
  }

  if (state === 'checking') {
    return standalone ? (
      <div className="relative min-h-screen">
        <SplashSpinner />
      </div>
    ) : (
      <SplashSpinner />
    )
  }

  if (state === 'error') {
    return <ErrorState onRetry={handleRetry} />
  }

  if (hasUser === false) {
    return <Navigate to="/" replace />
  }

  const isOnOnboardingRoute = loc.pathname === '/onboarding'
  if (!done && !isOnOnboardingRoute) {
    return <Navigate to="/onboarding" replace state={{ from: loc }} />
  }
  if (done && isOnOnboardingRoute) {
    return <Navigate to="/home" replace />
  }

  // Checks passed
  return <Outlet />
}
