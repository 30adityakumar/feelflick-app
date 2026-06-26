import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

// Control the shared OAuth hook so we can drive the landing's auth UI states.
const startGoogleAuth = vi.fn()
const clearAuthError = vi.fn()
let hookState
vi.mock('@/shared/hooks/useGoogleAuth', () => ({
  useGoogleAuth: () => hookState,
}))

import { LandingAuthProvider } from '../LandingAuth'
import LandingAuthStatus from '../components/LandingAuthStatus'
import LandingHeader from '../components/LandingHeader'
import LandingFinalCTA from '../components/LandingFinalCTA'

beforeEach(() => {
  startGoogleAuth.mockReset()
  clearAuthError.mockReset()
  hookState = { signInWithGoogle: startGoogleAuth, isAuthenticating: false, authError: null, clearAuthError }
})
afterEach(() => cleanup())

describe('Landing auth surface', () => {
  it('shows nothing when there is no error', () => {
    render(<LandingAuthProvider><LandingAuthStatus /></LandingAuthProvider>)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('announces a single safe error via role=alert with retry + dismiss', () => {
    hookState.authError = 'Google sign-in could not be started. Please try again.'
    render(<LandingAuthProvider><LandingAuthStatus /></LandingAuthProvider>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/could not be started/i)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(startGoogleAuth).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(clearAuthError).toHaveBeenCalledTimes(1)
  })

  it('uses one canonical "Continue with Google" label per region and shares one pending state', () => {
    render(
      <LandingAuthProvider>
        <LandingHeader />
        <LandingFinalCTA />
      </LandingAuthProvider>
    )
    // No "Sign in" / "Start with Google" duplicates remain.
    expect(screen.queryByRole('button', { name: /^sign in$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /start with google/i })).toBeNull()
    const ctas = screen.getAllByRole('button', { name: /continue with google/i })
    expect(ctas.length).toBeGreaterThanOrEqual(2) // header + final
    ctas.forEach((b) => expect(b).not.toBeDisabled())
  })

  it('disables every Google CTA while authentication is pending', () => {
    hookState.isAuthenticating = true
    render(
      <LandingAuthProvider>
        <LandingHeader />
        <LandingFinalCTA />
      </LandingAuthProvider>
    )
    const pending = screen.getAllByRole('button', { name: /opening google…/i })
    expect(pending.length).toBeGreaterThanOrEqual(2)
    pending.forEach((b) => expect(b).toBeDisabled())
  })
})
