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
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black">
      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(88,28,135,0.35) 0%, transparent 65%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(168,85,247,0.12) 0%, transparent 65%)' }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-8 px-4 text-center">
        {/* Brand */}
        <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          FEELFLICK
        </span>

        {error ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Sign In Failed</h2>
              <p className="text-sm text-white/50 max-w-sm leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 rounded-xl border border-white/15 text-white/80 text-sm font-medium hover:bg-white/6 hover:border-white/25 transition-all duration-200"
            >
              Return to Home
            </button>
          </>
        ) : (
          <>
            <svg
              className="h-10 w-10 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" stroke="rgba(168,85,247,0.2)" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9v9z" fill="rgb(168,85,247)" />
            </svg>
            <div>
              <p className="text-base font-semibold text-white/80 mb-1">Signing you in…</p>
              <p className="text-sm text-white/35">This should only take a moment</p>
            </div>
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