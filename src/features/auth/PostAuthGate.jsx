// src/features/auth/PostAuthGate.jsx
import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'

const isStrictTrue = (v) => v === true

function SplashSpinner() {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]">
      <div className="flex items-center gap-3 text-white/90">
        <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="4" />
          <path d="M21 12a9 9 0 0 0-9-9v9z" fill="currentColor" />
        </svg>
        <span className="text-[0.95rem] font-semibold">One moment…</span>
      </div>
    </div>
  )
}

/**
 * Decides where to send the user immediately after OAuth:
 * - If not signed in → back to "/"
 * - If signed in and onboarding complete → proceed (or redirect /onboarding → /home)
 * - If signed in and onboarding incomplete → redirect to "/onboarding"
 *
 * Use `<PostAuthGate standalone />` on the public `/post-auth` route
 * to render a clean background + spinner (prevents home flash).
 */
export default function PostAuthGate({ standalone = false }) {
  const [state, setState] = useState('checking') // 'checking' | 'ready'
  const [done, setDone] = useState(false)
  const [hasUser, setHasUser] = useState(null) // null | boolean
  const loc = useLocation()

  // If we *just* finished onboarding, skip checks once to avoid flash
  if (loc.state?.fromOnboarding === true) {
    return <Outlet />
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return

      if (!user) {
        setHasUser(false)
        setDone(false)
        setState('ready')
        return
      }
      setHasUser(true)

      const meta = user.user_metadata || {}
      if (
        isStrictTrue(meta.onboarding_complete) ||
        isStrictTrue(meta.has_onboarded) ||
        isStrictTrue(meta.onboarded)
      ) {
        setDone(true)
        setState('ready')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('onboarding_complete,onboarding_completed_at')
        .eq('id', user.id)
        .maybeSingle()

      if (!mounted) return
      if (error) {
        console.warn('users select error:', error)
        setDone(false)
      } else {
        const completed =
          isStrictTrue(data?.onboarding_complete) ||
          Boolean(data?.onboarding_completed_at)
        setDone(completed)
      }
      setState('ready')
    })()
    return () => { mounted = false }
  }, [])

  // Full-bleed spinner overlay while deciding (prevents /home flash)
  if (state === 'checking') {
    return standalone ? (
      <div className="relative min-h-screen">
        <div aria-hidden className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
        </div>
        <SplashSpinner />
      </div>
    ) : (
      <SplashSpinner />
    )
  }

  // Not authenticated? Back to landing.
  if (hasUser === false) {
    return <Navigate to="/" replace />
  }

  // Authenticated: route based on onboarding completion.
  if (!done && loc.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace state={{ from: loc }} />
  }
  if (done && loc.pathname === '/onboarding') {
    return <Navigate to="/home" replace />
  }

  // Otherwise render nested route
  return <Outlet />
}