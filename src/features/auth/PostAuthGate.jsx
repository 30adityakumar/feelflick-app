// src/app/auth/PostAuthGate.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'

function SplashSpinner({ label = 'Loading your profile…' }) {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
        <div className="text-white/75 text-sm">{label}</div>
      </div>
    </div>
  )
}

function isTruthyFlag(v) {
  return v === true || v === 'true' || v === 1 || v === '1'
}

function deriveOnboardingFromMetadata(user) {
  const meta = { ...(user?.app_metadata ?? {}), ...(user?.user_metadata ?? {}) }

  // If any of these keys exist, we treat metadata as “present”
  const hasAny =
    meta.onboarding_complete !== undefined ||
    meta.onboardingComplete !== undefined ||
    meta.has_onboarded !== undefined ||
    meta.hasOnboarded !== undefined ||
    meta.onboarded !== undefined ||
    meta.onboarding_completed_at !== undefined

  const isComplete =
    isTruthyFlag(meta.onboarding_complete) ||
    isTruthyFlag(meta.onboardingComplete) ||
    isTruthyFlag(meta.has_onboarded) ||
    isTruthyFlag(meta.hasOnboarded) ||
    isTruthyFlag(meta.onboarded)

  return { hasAny, isComplete }
}

/**
 * Post-Auth Gate
 *
 * Responsibilities:
 * 1) Ensure we have an authenticated session (else redirect to /)
 * 2) Determine onboarding status with a fast path (auth metadata) and a safe fallback (DB)
 * 3) Redirect accordingly:
 *    - Not authenticated → /
 *    - Authenticated + not onboarded → /onboarding
 *    - Authenticated + onboarded + currently on /onboarding → /home
 * 4) Provide an Outlet context so downstream routes can avoid duplicate auth lookups:
 *    { userId, user, session, isOnboarded }
 */
export default function PostAuthGate() {
  const location = useLocation()

  const [phase, setPhase] = useState('checking') // 'checking' | 'ready'
  const [hasUser, setHasUser] = useState(null) // null | boolean
  const [isOnboarded, setIsOnboarded] = useState(null) // null | boolean
  const [sessionUser, setSessionUser] = useState(null)
  const [session, setSession] = useState(null)

  // Avoid state updates after unmount
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Debug escape hatch:
  // /home?forceOnboardingDb=1 will bypass metadata fast-path
  const forceDbCheck = useMemo(() => {
    try {
      return new URLSearchParams(location.search).get('forceOnboardingDb') === '1'
    } catch {
      return false
    }
  }, [location.search])

  const applySession = async (nextSession) => {
    if (!mountedRef.current) return

    setSession(nextSession ?? null)
    const user = nextSession?.user ?? null
    setSessionUser(user)
    setHasUser(Boolean(user))

    if (!user) {
      setIsOnboarded(false)
      setPhase('ready')
      return
    }

    // Fast path: trust onboarding flags in auth metadata (very fast, no DB round trip)
    const meta = deriveOnboardingFromMetadata(user)
    if (!forceDbCheck && meta.hasAny) {
      setIsOnboarded(meta.isComplete)
      setPhase('ready')
      return
    }

    // Fallback: read onboarding status from DB (rare path; only if metadata absent/forced)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_complete,onboarding_completed_at')
        .eq('id', user.id)
        .maybeSingle()

      if (!mountedRef.current) return

      if (error) {
        console.warn('[PostAuthGate] Onboarding DB check error:', error)
        setIsOnboarded(false)
        setPhase('ready')
        return
      }

      const dbComplete =
        isTruthyFlag(data?.onboarding_complete) ||
        isTruthyFlag(data?.onboarded) ||
        isTruthyFlag(data?.has_onboarded)

      setIsOnboarded(dbComplete)
      setPhase('ready')
    } catch (e) {
      if (!mountedRef.current) return
      console.warn('[PostAuthGate] Onboarding DB check threw:', e)
      setIsOnboarded(false)
      setPhase('ready')
    }
  }

  useEffect(() => {
    let cancelled = false

    async function init() {
      setPhase('checking')

      const { data, error } = await supabase.auth.getSession()
      if (cancelled || !mountedRef.current) return

      if (error) {
        console.warn('[PostAuthGate] getSession error:', error)
        await applySession(null)
        return
      }

      await applySession(data?.session ?? null)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (cancelled || !mountedRef.current) return
      setPhase('checking')
      await applySession(nextSession ?? null)
    })

    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceDbCheck])

  // While determining session/onboarding (rarely more than 1–2 round-trips), block route render
  if (phase !== 'ready' || hasUser === null || isOnboarded === null) {
    return <SplashSpinner label="Loading your profile…" />
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

  const outletContext = {
    userId: sessionUser?.id ?? null,
    user: sessionUser,
    session,
    isOnboarded,
  }

  return <Outlet context={outletContext} />
}
