// src/features/auth/OAuthCallback.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'

/**
 * OAuth Callback Handler
 * 
 * Handles the OAuth redirect from Google sign-in:
 * - Extracts tokens from URL hash
 * - Sets Supabase session
 * - Routes based on onboarding status
 * - Shows loading state during processing
 */

function SplashSpinner({ error = null }) {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-gradient-to-br from-[#0a121a] via-[#0d1722] to-[#0c1017]">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>

      <div className="relative flex flex-col items-center gap-6 px-4">
        {error ? (
          <>
            {/* Error State */}
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Sign In Failed</h2>
              <p className="text-sm text-white/60 max-w-sm">
                {error}
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-all duration-300"
            >
              Return to Home
            </button>
          </>
        ) : (
          <>
            {/* Loading State */}
            <svg 
              className="h-12 w-12 animate-spin text-purple-400" 
              viewBox="0 0 24 24" 
              fill="none"
              aria-hidden="true"
            >
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeOpacity=".25" 
                strokeWidth="4" 
              />
              <path 
                d="M21 12a9 9 0 0 0-9-9v9z" 
                fill="currentColor" 
              />
            </svg>
            <span className="text-lg font-semibold text-white/90">
              Completing sign in...
            </span>
            <span className="text-sm text-white/50">
              This should only take a moment
            </span>
          </>
        )}
      </div>
    </div>
  )
}

export default function OAuthCallback() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function handleOAuthCallback() {
      try {
        // Extract tokens from URL hash
        // Supabase redirects with tokens in the hash fragment
        let hashParams = new URLSearchParams(window.location.hash.substring(1))
        
        // Fallback: check React Router location hash
        if (!hashParams.has('access_token')) {
          hashParams = new URLSearchParams(location.hash?.substring(1) || '')
        }
        
        const access_token = hashParams.get('access_token')
        const refresh_token = hashParams.get('refresh_token')
        const error_description = hashParams.get('error_description')

        // Handle OAuth errors
        if (error_description) {
          console.error('OAuth error:', error_description)
          if (mounted) {
            setError(error_description)
          }
          // Redirect after showing error for 3 seconds
          setTimeout(() => {
            if (mounted) {
              navigate('/', { replace: true })
            }
          }, 3000)
          return
        }

        console.log('[OAuth] Tokens found:', { 
          access_token: !!access_token, 
          refresh_token: !!refresh_token 
        })

        // Set session if we have tokens
        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          })

          if (sessionError) {
            console.error('[OAuth] Failed to set session:', sessionError)
            if (mounted) {
              setError('Failed to complete sign in. Please try again.')
            }
            setTimeout(() => {
              if (mounted) {
                navigate('/', { replace: true })
              }
            }, 3000)
            return
          }

          // Clean the hash from URL for security
          window.history.replaceState(null, '', window.location.pathname)
        }

        // Verify session was set correctly
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          console.error('[OAuth] No session after OAuth:', sessionError)
          if (mounted) {
            setError('Sign in was incomplete. Please try again.')
          }
          setTimeout(() => {
            if (mounted) {
              navigate('/', { replace: true })
            }
          }, 3000)
          return
        }

        console.log('[OAuth] Session verified, checking onboarding status')

        // Check onboarding status from user metadata
        const meta = session.user.user_metadata || {}
        const isOnboarded =
          meta.onboarding_complete === true ||
          meta.has_onboarded === true ||
          meta.onboarded === true

        console.log('[OAuth] Onboarding status:', { isOnboarded })

        // Route to appropriate page
        const destination = isOnboarded ? '/home' : '/onboarding'
        console.log('[OAuth] Redirecting to:', destination)

        if (mounted) {
          navigate(destination, { replace: true })
        }

      } catch (err) {
        console.error('[OAuth] Unexpected error:', err)
        if (mounted) {
          setError('An unexpected error occurred. Please try again.')
        }
        setTimeout(() => {
          if (mounted) {
            navigate('/', { replace: true })
          }
        }, 3000)
      }
    }

    handleOAuthCallback()

    return () => {
      mounted = false
    }
  }, [navigate, location])

  return <SplashSpinner error={error} />
}