import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

// Mock the OAuth dependencies so the hook is exercised in isolation.
const signInWithOAuth = vi.fn(async () => ({ error: null }))
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { auth: { signInWithOAuth: (...a) => signInWithOAuth(...a) } },
}))
vi.mock('@/shared/lib/auth/oauthNonce', () => ({
  issueOAuthCallbackNonce: vi.fn(() => 'test-nonce'),
  OAUTH_NONCE_QUERY_PARAM: 'ff_oauth_nonce',
}))

import { useGoogleAuth } from '../useGoogleAuth'

beforeEach(() => {
  signInWithOAuth.mockReset()
  signInWithOAuth.mockResolvedValue({ error: null })
  vi.spyOn(window, 'alert').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('useGoogleAuth', () => {
  it('builds a same-origin /auth/callback redirect carrying the nonce', async () => {
    const { result } = renderHook(() => useGoogleAuth())
    await act(async () => { await result.current.signInWithGoogle() })
    expect(signInWithOAuth).toHaveBeenCalledTimes(1)
    const opts = signInWithOAuth.mock.calls[0][0]
    expect(opts.provider).toBe('google')
    const redirect = new URL(opts.options.redirectTo)
    expect(redirect.origin).toBe(window.location.origin)
    expect(redirect.pathname).toBe('/auth/callback')
    expect(redirect.searchParams.get('ff_oauth_nonce')).toBe('test-nonce')
  })

  it('prevents a duplicate submission while a sign-in is pending', async () => {
    const { result } = renderHook(() => useGoogleAuth())
    await act(async () => { await result.current.signInWithGoogle() })
    // Success keeps the pending state (the page is redirecting away).
    expect(result.current.isAuthenticating).toBe(true)
    await act(async () => { await result.current.signInWithGoogle() })
    expect(signInWithOAuth).toHaveBeenCalledTimes(1)
  })

  it('on failure sets a fixed safe error and never alerts when alert is suppressed', async () => {
    signInWithOAuth.mockResolvedValueOnce({ error: new Error('raw provider detail') })
    const { result } = renderHook(() => useGoogleAuth({ suppressAlert: true }))
    await act(async () => { await result.current.signInWithGoogle() })
    await waitFor(() => expect(result.current.authError).toBeTruthy())
    expect(result.current.authError).toMatch(/could not be started/i)
    expect(result.current.authError).not.toMatch(/raw provider detail/i)
    expect(window.alert).not.toHaveBeenCalled()
    expect(result.current.isAuthenticating).toBe(false)
  })

  it('alerts on failure when alert is not suppressed (non-landing callers)', async () => {
    signInWithOAuth.mockResolvedValueOnce({ error: new Error('boom') })
    const { result } = renderHook(() => useGoogleAuth())
    await act(async () => { await result.current.signInWithGoogle() })
    await waitFor(() => expect(window.alert).toHaveBeenCalledTimes(1))
  })

  it('clearAuthError resets the error', async () => {
    signInWithOAuth.mockResolvedValueOnce({ error: new Error('boom') })
    const { result } = renderHook(() => useGoogleAuth({ suppressAlert: true }))
    await act(async () => { await result.current.signInWithGoogle() })
    await waitFor(() => expect(result.current.authError).toBeTruthy())
    act(() => result.current.clearAuthError())
    expect(result.current.authError).toBeNull()
  })
})
