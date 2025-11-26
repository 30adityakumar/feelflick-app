// src/features/auth/OAuthCallback.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'

function SplashSpinner() {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-gradient-to-br from-[#0a121a] via-[#0d1722] to-[#0c1017]">
      <div className="flex flex-col items-center gap-4">
        <svg className="h-10 w-10 animate-spin text-purple-400" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="4" />
          <path d="M21 12a9 9 0 0 0-9-9v9z" fill="currentColor" />
        </svg>
        <span className="text-base font-semibold text-white/80">Completing sign in...</span>
      </div>
    </div>
  )
}

export default function OAuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    async function handleOAuthCallback() {
      try {
        // Parse hash from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const access_token = hashParams.get('access_token')
        const refresh_token = hashParams.get('refresh_token')

        if (access_token && refresh_token) {
          // Set the session explicitly
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          })

          if (sessionError) {
            console.error('Failed to set session:', sessionError)
            navigate('/', { replace: true })
            return
          }

          // Clean the hash from URL
          window.history.replaceState(null, '', window.location.pathname)
        }

        // Now fetch the session to verify and route
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
          console.error('No session after OAuth:', error)
          navigate('/', { replace: true })
          return
        }

        // Check onboarding status
        const meta = session.user.user_metadata || {}
        const isOnboarded =
          meta.onboarding_complete === true ||
          meta.has_onboarded === true ||
          meta.onboarded === true

        navigate(isOnboarded ? '/home' : '/onboarding', { replace: true })
      } catch (err) {
        console.error('OAuth callback error:', err)
        navigate('/', { replace: true })
      }
    }

    handleOAuthCallback()
  }, [navigate])

  return <SplashSpinner />
}
