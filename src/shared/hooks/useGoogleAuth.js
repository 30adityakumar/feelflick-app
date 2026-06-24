// src/shared/hooks/useGoogleAuth.js
import { useCallback, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import {
  issueOAuthCallbackNonce,
  OAUTH_NONCE_QUERY_PARAM,
} from '@/shared/lib/auth/oauthNonce'

// A fixed, safe failure message — never surfaces a raw Supabase/network error.
const SAFE_AUTH_ERROR = 'Google sign-in could not be started. Please try again.'

/**
 * Shared Google OAuth hook for all sign-in CTAs.
 *
 * Returns `signInWithGoogle()`, `isAuthenticating`, plus an accessible
 * `authError`/`clearAuthError` pair so a caller can render its own inline error.
 *
 * @param {object}  [opts]
 * @param {boolean} [opts.suppressAlert=false] — when true, the hook does NOT call
 *   the native `alert()` on failure (it only sets `authError`). The landing page
 *   opts out so it can show a landing-owned accessible error surface; other
 *   surfaces keep the existing `alert()` behaviour unchanged (no regression).
 */
export function useGoogleAuth({ suppressAlert = false } = {}) {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState(null)
  const clearAuthError = useCallback(() => setAuthError(null), [])

  async function signInWithGoogle() {
    if (isAuthenticating) return
    setIsAuthenticating(true)
    setAuthError(null)

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
      // On success the browser redirects to Google — keep the pending state until
      // the page unloads (do not reset isAuthenticating here).
    } catch {
      // Never surface raw errors. Set an accessible error state; only alert when a
      // caller has not opted out (preserves existing non-landing failure UX).
      console.error('Auth error: failed to start Google sign-in')
      setAuthError(SAFE_AUTH_ERROR)
      if (!suppressAlert) alert('Sign in failed. Please try again.')
      setIsAuthenticating(false)
    }
  }

  return { signInWithGoogle, isAuthenticating, authError, clearAuthError }
}
