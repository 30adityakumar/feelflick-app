// src/features/landing/utils/useGoogleAuth.js
import { useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Auth error:', error)
      alert('Sign in failed. Please try again.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  return { signInWithGoogle, isAuthenticating }
}
