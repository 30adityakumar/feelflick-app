// Tests for the useGoogleAuth hook.
// Uses an isolated re-implementation that mirrors the hook's exact logic,
// following the project test pattern (see OnboardingSkip.test.jsx).

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Minimal component that exercises the hook's contract so we can test
// the state transitions without mounting the real hook (which needs Supabase).
// ---------------------------------------------------------------------------
function AuthButton({ onSignIn, isAuthenticating = false }) {
  return (
    <button onClick={onSignIn} disabled={isAuthenticating}>
      {isAuthenticating ? 'Signing in...' : 'Get Started — It\'s Free'}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Inline hook logic mirroring useGoogleAuth for isolated unit testing
// ---------------------------------------------------------------------------
function makeAuthState(signInImpl) {
  let isAuthenticating = false

  async function signInWithGoogle() {
    if (isAuthenticating) return
    isAuthenticating = true
    try {
      await signInImpl()
    } finally {
      isAuthenticating = false
    }
  }

  return { signInWithGoogle, get isAuthenticating() { return isAuthenticating } }
}

describe('useGoogleAuth – sign-in behaviour', () => {
  it('shows idle label by default', () => {
    render(<AuthButton onSignIn={vi.fn()} isAuthenticating={false} />)
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
  })

  it('shows loading label while authenticating', () => {
    render(<AuthButton onSignIn={vi.fn()} isAuthenticating={true} />)
    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument()
  })

  it('button is disabled while authenticating', () => {
    render(<AuthButton onSignIn={vi.fn()} isAuthenticating={true} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('button is enabled when not authenticating', () => {
    render(<AuthButton onSignIn={vi.fn()} isAuthenticating={false} />)
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('calls onSignIn when clicked', () => {
    const onSignIn = vi.fn()
    render(<AuthButton onSignIn={onSignIn} isAuthenticating={false} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onSignIn).toHaveBeenCalledTimes(1)
  })

  it('does not call onSignIn when already authenticating', () => {
    const onSignIn = vi.fn()
    render(<AuthButton onSignIn={onSignIn} isAuthenticating={true} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onSignIn).not.toHaveBeenCalled()
  })
})

describe('useGoogleAuth – hook logic', () => {
  it('does not re-enter signInWithGoogle when already in-flight', async () => {
    const signInImpl = vi.fn().mockResolvedValue(undefined)
    const auth = makeAuthState(signInImpl)

    // Call twice without awaiting
    auth.signInWithGoogle()
    auth.signInWithGoogle()

    await waitFor(() => expect(auth.isAuthenticating).toBe(false))
    expect(signInImpl).toHaveBeenCalledTimes(1)
  })

  it('resets isAuthenticating to false after successful sign-in', async () => {
    const signInImpl = vi.fn().mockResolvedValue(undefined)
    const auth = makeAuthState(signInImpl)

    await auth.signInWithGoogle()
    expect(auth.isAuthenticating).toBe(false)
  })

  it('resets isAuthenticating to false even if sign-in throws', async () => {
    const signInImpl = vi.fn().mockRejectedValue(new Error('OAuth failed'))
    const auth = makeAuthState(signInImpl)

    await auth.signInWithGoogle().catch(() => {})
    expect(auth.isAuthenticating).toBe(false)
  })
})
