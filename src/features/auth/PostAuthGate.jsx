// src/features/auth/PostAuthGate.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'

export default function PostAuthGate() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const user = data?.session?.user
        if (!user) {
          if (!cancelled) navigate('/', { replace: true })
          return
        }

        // Fast metadata hint
        const m = user.user_metadata || {}
        if (m.onboarding_complete || m.has_onboarded || m.onboarded) {
          if (!cancelled) navigate('/home', { replace: true })
          return
        }

        // Source of truth: users table
        const { data: row, error } = await supabase
          .from('users')
          .select('onboarding_complete,onboarding_completed_at')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          if (!cancelled) navigate('/onboarding', { replace: true })
          return
        }

        const completed = row?.onboarding_complete === true || Boolean(row?.onboarding_completed_at)
        if (!cancelled) navigate(completed ? '/home' : '/onboarding', { replace: true })
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()
    return () => { cancelled = true }
  }, [navigate])

  return (
    <div className="min-h-[60vh] grid place-items-center text-white/90 font-semibold">
      Signing you in…
    </div>
  )
}