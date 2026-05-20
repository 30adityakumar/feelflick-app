// src/features/landing/utils/useGoogleAuth.js
import { useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import {
  issueOAuthCallbackNonce,
  OAUTH_NONCE_QUERY_PARAM,
} from '@/shared/lib/auth/oauthNonce'

/**
 * Shared Google OAuth hook for all landing page sign-in CTAs.
 * Returns signInWithGoogle() and isAuthenticating state.
 */
export function useGoogleAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  async function signInWithGoogle() {
    if (isAuthenticating) return
    setIsAuthenticating(true)

    try {
      const nonce = issueOAuthCallbackNonce()
      if (!nonce) {
        throw new Error('Could not initialize secure OAuth callback state')
      }

      const redirectUrl = new URL('/auth/callback', window.location.origin)
      redirectUrl.searchParams.set(OAUTH_NONCE_QUERY_PARAM, nonce)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl.toString(),
        },
      })
      if (error) throw error
    } catch {
      console.error('Auth error: failed to start Google sign-in')
      alert('Sign in failed. Please try again.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  return { signInWithGoogle, isAuthenticating }
}
