// src/app/AuthInitializer.jsx 
import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

export function useAuthInitializer() {
  const [isProcessing, setIsProcessing] = useState(() => {
    return sessionStorage.getItem('oauth_redirect_pending') === 'true'
  })

  useEffect(() => {
    const hash = window.location.hash
    const oauthPending = sessionStorage.getItem('oauth_redirect_pending') === 'true'

    if ((hash && hash.includes('access_token')) || oauthPending) {
      console.log('Processing OAuth callback...')
      
      // Extract tokens from hash manually
      const hashParams = new URLSearchParams(hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      
      if (accessToken && refreshToken) {
        console.log('Tokens found, setting session...')
        
        // Set the session manually
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        }).then(({ data, error }) => {
          if (error) {
            console.error('Error setting session:', error)
            sessionStorage.removeItem('oauth_redirect_pending')
            setIsProcessing(false)
            return
          }

          if (data.session) {
            console.log('Session established, user:', data.session.user.email)
            
            sessionStorage.removeItem('oauth_redirect_pending')
            
            // Check onboarding
            const meta = data.session.user.user_metadata
            const isOnboarded = 
              meta.onboarding_complete === true || 
              meta.has_onboarded === true || 
              meta.onboarded === true
            
            console.log('Onboarding status:', isOnboarded)
            
            // Redirect
            if (isOnboarded) {
              window.location.href = '/home'
            } else {
              window.location.href = '/onboarding'
            }
          } else {
            console.warn('No session after setting tokens')
            sessionStorage.removeItem('oauth_redirect_pending')
            setIsProcessing(false)
          }
        })
      } else {
        console.warn('No tokens in hash')
        sessionStorage.removeItem('oauth_redirect_pending')
        setIsProcessing(false)
      }
    } else {
      setIsProcessing(false)
    }
  }, [])

  return { isProcessing }
}

export default function AuthInitializer({ children }) {
  const { isProcessing } = useAuthInitializer()

  if (isProcessing) {
    return (
      <div className="fixed inset-0 z-[9999] grid place-items-center bg-gradient-to-br from-[#0a121a] via-[#0d1722] to-[#0c1017]">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-10 w-10 animate-spin text-purple-400" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="4" />
            <path d="M21 12a9 9 0 0 0-9-9v9z" fill="currentColor" />
          </svg>
          <span className="text-base font-semibold text-white/80">Signing you in...</span>
        </div>
      </div>
    )
  }

  return children
}
