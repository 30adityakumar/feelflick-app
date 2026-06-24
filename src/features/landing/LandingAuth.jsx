// src/features/landing/LandingAuth.jsx
// One Landing-owned Google OAuth authority (§18). The provider calls the shared
// useGoogleAuth ONCE (with alert suppressed) so every CTA on the page shares a
// single pending state + a single duplicate-submit guard, and failures surface
// through one accessible landing-owned error surface (LandingAuthStatus).
import { createContext, useContext } from 'react'
import { useGoogleAuth } from '@/shared/hooks/useGoogleAuth'

const LandingAuthContext = createContext(null)

export function LandingAuthProvider({ children }) {
  const { signInWithGoogle, isAuthenticating, authError, clearAuthError } = useGoogleAuth({ suppressAlert: true })
  const value = {
    startGoogleAuth: signInWithGoogle,
    isAuthenticating,
    authError,
    clearAuthError,
  }
  return <LandingAuthContext.Provider value={value}>{children}</LandingAuthContext.Provider>
}

export function useLandingAuth() {
  const ctx = useContext(LandingAuthContext)
  if (!ctx) throw new Error('useLandingAuth must be used within LandingAuthProvider')
  return ctx
}
