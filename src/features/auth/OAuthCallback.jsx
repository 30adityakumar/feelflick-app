// src/features/auth/OAuthCallback.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import BrandSplash from '@/shared/ui/BrandSplash'
import { track } from '@/shared/services/analytics'
import {
  consumeOAuthCallbackNonce,
  readOAuthNonceFromUrl,
} from '@/shared/lib/auth/oauthNonce'
import { deriveOnboardingStatus } from '@/shared/lib/auth/onboardingStatus'

/**
 * OAuth Callback Handler
 *
 * Handles the OAuth redirect from Google sign-in:
 * - Extracts tokens from URL hash
 * - Sets Supabase session
 * - Routes based on onboarding status
 * - Shows BrandSplash during processing (200ms delayed visibility so fast
 *   callbacks don't flash; errors are immediate).
 */

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
          console.error('OAuth callback returned an error')
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

        // Set session if we have tokens
        if (access_token && refresh_token) {
          const nonce = readOAuthNonceFromUrl()
          const nonceValid = nonce ? consumeOAuthCallbackNonce(nonce) : false

          if (!nonceValid) {
            if (mounted) {
              setError('Your sign-in session expired. Please try again.')
            }
            window.history.replaceState(null, '', '/')
            setTimeout(() => {
              if (mounted) {
                navigate('/', { replace: true })
              }
            }, 3000)
            return
          }

          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          })

          if (sessionError) {
            console.error('[OAuth] Failed to set session')
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
          window.history.replaceState(null, '', '/auth/callback')
        }

        // Verify session was set correctly
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          console.error('[OAuth] No session after OAuth callback')
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

        // Check onboarding status from user metadata (same derivation as PostAuthGate)
        const { isComplete: isOnboarded } = deriveOnboardingStatus(session.user)

        // Route to appropriate page
        const destination = isOnboarded ? '/home' : '/onboarding'

        if (!isOnboarded) {
          track('signup', { method: 'google' })
        }

        if (mounted) {
          navigate(destination, { replace: true })
        }

      } catch {
        console.error('[OAuth] Unexpected callback error')
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

  return <BrandSplash label="Signing you in…" error={error} />
}
