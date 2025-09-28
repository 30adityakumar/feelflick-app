// src/features/auth/components/OAuthFinish.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'

export default function OAuthFinish() {
  const nav = useNavigate()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // In case we returned with tokens in the URL (PKCE/code flow)
        const hash = window.location.hash || ''
        if (hash.includes('access_token') || hash.includes('code')) {
          try { await supabase.auth.exchangeCodeForSession(hash) } catch {}
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          nav('/', { replace: true })
          return
        }

        // Ensure a row exists (ok if RLS blocks — we’ll just continue)
        try {
          await supabase.from('users').upsert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url ?? null,
            signup_source: 'google',
          }, { onConflict: 'id' })
        } catch {}

        const { data: profile } = await supabase
          .from('users')
          .select('onboarding_complete')
          .eq('id', user.id)
          .maybeSingle()

        const done = profile?.onboarding_complete === true
        if (!mounted) return
        nav(done ? '/home' : '/onboarding', { replace: true, state: { fromGoogle: true } })
      } catch {
        if (!mounted) return
        nav('/onboarding', { replace: true })
      }
    })()
    return () => { mounted = false }
  }, [nav])

  return <div className="p-6 text-white/70">Signing you in…</div>
}