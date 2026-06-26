import { afterEach, beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// The shared header is rendered on anonymous Landing, anonymous app routes
// (/discover, /browse), and authenticated app routes — one implementation, not a
// copied Landing clone. These tests cover the anonymous + authenticated branches.

class Observer { observe() {} unobserve() {} disconnect() {} }
beforeAll(() => { vi.stubGlobal('ResizeObserver', Observer); vi.stubGlobal('IntersectionObserver', Observer) })
afterAll(() => vi.unstubAllGlobals())

const signInWithGoogle = vi.fn()
let authState
let googleState
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => authState }))
vi.mock('@/shared/hooks/useGoogleAuth', () => ({ useGoogleAuth: () => googleState }))
vi.mock('@/shared/lib/supabase/client', () => ({ supabase: { auth: { signOut: vi.fn(async () => ({ error: null })) } } }))
vi.mock('@/features/onboarding/draft', () => ({ clearDraft: vi.fn() }))

import Header from '../Header'

beforeEach(() => {
  signInWithGoogle.mockReset()
  authState = { user: null, isAuthenticated: false }
  googleState = { signInWithGoogle, isAuthenticating: false }
})
afterEach(() => { cleanup(); vi.clearAllMocks() })

function renderHeader(props = {}) {
  const onOpenSearch = vi.fn()
  render(<MemoryRouter><Header onOpenSearch={onOpenSearch} {...props} /></MemoryRouter>)
  return { onOpenSearch }
}

describe('Header — anonymous', () => {
  it('wordmark links to / and exposes anonymous Discover + Browse navigation', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'FEELFLICK' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Discover' })).toHaveAttribute('href', '/discover')
    expect(screen.getByRole('link', { name: 'Browse' })).toHaveAttribute('href', '/browse')
  })

  it('exposes a search launcher that calls onOpenSearch', () => {
    const { onOpenSearch } = renderHeader()
    const searchButtons = screen.getAllByRole('button', { name: /search films/i })
    expect(searchButtons.length).toBeGreaterThanOrEqual(1)
    fireEvent.click(searchButtons[0])
    expect(onOpenSearch).toHaveBeenCalledTimes(1)
  })

  it('shows Sign in (visible "Sign in", accessible "Sign in with Google") and starts Google auth once', () => {
    renderHeader()
    const signIn = screen.getByRole('button', { name: /sign in with google/i })
    expect(signIn).toHaveTextContent(/^Sign in$/)
    fireEvent.click(signIn)
    expect(signInWithGoogle).toHaveBeenCalledTimes(1)
  })

  it('disables Sign in and shows pending copy while authenticating', () => {
    googleState.isAuthenticating = true
    renderHeader()
    const signIn = screen.getByRole('button', { name: /sign in with google/i })
    expect(signIn).toBeDisabled()
    expect(signIn).toHaveTextContent(/signing in…/i)
  })

  it('renders no authenticated account controls', () => {
    renderHeader()
    expect(screen.queryByRole('button', { name: /account menu/i })).toBeNull()
  })

  it('mobile Search trigger and Sign in carry 44px practical targets', () => {
    renderHeader()
    const mobileSearch = screen
      .getAllByRole('button', { name: /search films/i })
      .find((b) => b.className.includes('lg:hidden'))
    expect(mobileSearch).toBeTruthy()
    expect(mobileSearch.className).toMatch(/\bw-11\b/)
    expect(mobileSearch.className).toMatch(/\bh-11\b/)
    const signIn = screen.getByRole('button', { name: /sign in with google/i })
    expect(signIn.className).toMatch(/min-h-\[44px\]/)
  })
})

describe('Header — authenticated', () => {
  beforeEach(() => {
    authState = { user: { id: 'u1', email: 'a@b.com', user_metadata: { name: 'Ada' } }, isAuthenticated: true }
  })

  it('wordmark links to /home with authenticated nav (Tonight/Discover/DNA)', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'FEELFLICK' })).toHaveAttribute('href', '/home')
    expect(screen.getByRole('link', { name: 'Tonight' })).toHaveAttribute('href', '/home')
    expect(screen.getByRole('link', { name: 'Discover' })).toHaveAttribute('href', '/discover')
    expect(screen.getByRole('link', { name: 'DNA' })).toHaveAttribute('href', '/profile')
  })

  it('shows the account menu and no anonymous Sign in', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /account menu/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign in/i })).toBeNull()
  })
})

// The quiet tone (Landing) changes only visual density/emphasis — the same markup,
// controls, accessible names, and behavior must remain.
describe('Header — quiet tone (Landing)', () => {
  it('marks the header data-tone="quiet" while keeping all controls', () => {
    renderHeader({ tone: 'quiet' })
    expect(document.querySelector('header')).toHaveAttribute('data-tone', 'quiet')
    expect(screen.getByRole('link', { name: 'FEELFLICK' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Discover' })).toHaveAttribute('href', '/discover')
    expect(screen.getByRole('link', { name: 'Browse' })).toHaveAttribute('href', '/browse')
    expect(screen.getAllByRole('button', { name: /search films/i }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: /sign in with google/i })).toHaveTextContent(/^Sign in$/)
  })

  it('keeps Sign in wired to shared Google auth and a 44px practical target', () => {
    renderHeader({ tone: 'quiet' })
    const signIn = screen.getByRole('button', { name: /sign in with google/i })
    expect(signIn.className).toMatch(/min-h-\[44px\]/)
    fireEvent.click(signIn)
    expect(signInWithGoogle).toHaveBeenCalledTimes(1)
  })

  it('keeps the search launcher wired to onOpenSearch', () => {
    const { onOpenSearch } = renderHeader({ tone: 'quiet' })
    fireEvent.click(screen.getAllByRole('button', { name: /search films/i })[0])
    expect(onOpenSearch).toHaveBeenCalledTimes(1)
  })

  // The quiet Sign in is a distinct render branch, so lock the pending/disabled
  // parity the variant promises (mirrors the default-tone pending test).
  it('disables Sign in and shows pending copy while authenticating', () => {
    googleState.isAuthenticating = true
    renderHeader({ tone: 'quiet' })
    const signIn = screen.getByRole('button', { name: /sign in with google/i })
    expect(signIn).toBeDisabled()
    expect(signIn).toHaveTextContent(/signing in…/i)
  })

  it('keeps the 44×44 mobile search trigger', () => {
    renderHeader({ tone: 'quiet' })
    const mobileSearch = screen
      .getAllByRole('button', { name: /search films/i })
      .find((b) => b.className.includes('lg:hidden'))
    expect(mobileSearch).toBeTruthy()
    expect(mobileSearch.className).toMatch(/\bw-11\b/)
    expect(mobileSearch.className).toMatch(/\bh-11\b/)
  })

  it('default tone marks data-tone="default"', () => {
    renderHeader()
    expect(document.querySelector('header')).toHaveAttribute('data-tone', 'default')
  })
})
