import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }))

vi.mock('react-router-dom', async (orig) => ({
  ...(await orig()),
  useNavigate: () => mockNavigate,
  // Mirror the real hash so the callback's router-hash fallback matches window.location.
  useLocation: () => ({ hash: window.location.hash }),
}))
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      setSession: vi.fn(async () => ({ error: null })),
    },
  },
}))
vi.mock('@/shared/services/analytics', () => ({ track: vi.fn() }))

import OAuthCallback from '../OAuthCallback'

const RAW = 'Totally fake phishing message from the provider'
const SAFE = 'Sign in was cancelled or could not be completed. Please try again.'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  window.history.replaceState(null, '', '/auth/callback')
})

describe('OAuthCallback — provider error handling', () => {
  it('renders a fixed safe message and never the raw provider error_description', async () => {
    window.history.replaceState(null, '', `/auth/callback#error=access_denied&error_description=${encodeURIComponent(RAW)}`)
    render(<OAuthCallback />)
    expect(await screen.findByText(SAFE)).toBeInTheDocument()
    expect(screen.queryByText(new RegExp(RAW, 'i'))).toBeNull()
    expect(document.body.textContent).not.toContain(RAW)
  })

  it('strips the provider error payload from the URL immediately', async () => {
    window.history.replaceState(null, '', `/auth/callback#error=access_denied&error_description=${encodeURIComponent(RAW)}`)
    render(<OAuthCallback />)
    await waitFor(() => expect(window.location.hash).toBe(''))
    expect(window.location.href).not.toContain('error_description')
    expect(window.location.href).not.toContain(encodeURIComponent(RAW))
  })

  it('detects a bare `error` param (no description) and still shows the safe message', async () => {
    window.history.replaceState(null, '', '/auth/callback#error=server_error')
    render(<OAuthCallback />)
    expect(await screen.findByText(SAFE)).toBeInTheDocument()
    await waitFor(() => expect(window.location.hash).toBe(''))
  })
})
