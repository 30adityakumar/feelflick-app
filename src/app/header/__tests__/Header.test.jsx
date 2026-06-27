import { afterEach, beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
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

function renderHeader() {
  const onOpenSearch = vi.fn()
  render(<MemoryRouter><Header onOpenSearch={onOpenSearch} /></MemoryRouter>)
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

describe('Header — anonymous mobile menu (hamburger)', () => {
  it('exposes a hamburger that reveals Discover/Browse + Sign in (the <md nav path)', () => {
    renderHeader()
    const hamburger = screen.getByRole('button', { name: /open menu/i })
    expect(hamburger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(hamburger)
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute('aria-expanded', 'true')

    // Scope to the hamburger's own nav so we don't collide with the desktop MorphNav.
    const menu = screen.getByRole('navigation', { name: /site/i })
    expect(within(menu).getByRole('link', { name: 'Discover' })).toHaveAttribute('href', '/discover')
    expect(within(menu).getByRole('link', { name: 'Browse' })).toHaveAttribute('href', '/browse')
  })

  it('the hamburger Sign in invokes the shared Google auth once', () => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    const menuSignIns = screen.getAllByRole('button', { name: /sign in with google/i })
    // The bar Sign in (hidden md:flex) + the hamburger Sign in both exist in the DOM.
    fireEvent.click(menuSignIns[menuSignIns.length - 1])
    expect(signInWithGoogle).toHaveBeenCalledTimes(1)
  })
})

describe('Header — authenticated', () => {
  beforeEach(() => {
    authState = { user: { id: 'u1', email: 'a@b.com', user_metadata: { name: 'Ada' } }, isAuthenticated: true }
  })

  it('wordmark links to /home with authenticated nav (Home/Browse/Discover/DNA)', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'FEELFLICK' })).toHaveAttribute('href', '/home')
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/home')
    expect(screen.getByRole('link', { name: 'Browse' })).toHaveAttribute('href', '/browse')
    expect(screen.getByRole('link', { name: 'Discover' })).toHaveAttribute('href', '/discover')
    expect(screen.getByRole('link', { name: 'DNA' })).toHaveAttribute('href', '/profile')
  })

  it('shows the account menu (44px target) and no anonymous Sign in or hamburger', () => {
    renderHeader()
    const account = screen.getByRole('button', { name: /account menu/i })
    expect(account).toBeInTheDocument()
    expect(account.className).toMatch(/min-w-\[44px\]/)
    expect(account.className).toMatch(/min-h-\[44px\]/)
    expect(screen.queryByRole('button', { name: /sign in/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /open menu/i })).toBeNull()
  })
})
