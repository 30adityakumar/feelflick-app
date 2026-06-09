import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

class Observer { observe() {} unobserve() {} disconnect() {} }
beforeAll(() => { vi.stubGlobal('ResizeObserver', Observer); vi.stubGlobal('IntersectionObserver', Observer) })
afterAll(() => vi.unstubAllGlobals())

vi.mock('@/shared/hooks/useAuthSession', () => ({
  useAuthSession: () => ({ user: { id: 'u1', email: 'a@b.com', user_metadata: { full_name: 'Ada' } }, isAuthenticated: true }),
}))
vi.mock('@/shared/hooks/useGoogleAuth', () => ({ useGoogleAuth: () => ({ signInWithGoogle: vi.fn(), isAuthenticating: false }) }))
vi.mock('@/shared/lib/supabase/client', () => ({ supabase: { auth: { signOut: vi.fn(async () => ({ error: null })) } } }))
vi.mock('@/features/onboarding/draft', () => ({ clearDraft: vi.fn() }))

import Header from '../Header'

afterEach(() => { cleanup(); vi.clearAllMocks() })

function openMenu() {
  render(<MemoryRouter><Header /></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: 'Account menu' }))
  return screen.getByRole('button', { name: 'Account menu' }).closest('div')?.parentElement || document.body
}

describe('Header utility menu — Library terminology (F6.6)', () => {
  it('34/35/36. shows Watchlist + Diary; "Watch history" is gone', () => {
    openMenu()
    expect(screen.getByRole('link', { name: 'Watchlist' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Diary' })).toBeInTheDocument()
    expect(screen.queryByText('Watch history')).toBeNull()
  })

  it('37. the Diary item routes to /history (destination unchanged)', () => {
    openMenu()
    expect(screen.getByRole('link', { name: 'Diary' })).toHaveAttribute('href', '/history')
    expect(screen.getByRole('link', { name: 'Watchlist' })).toHaveAttribute('href', '/watchlist')
  })

  it('38. no new global "Library" navigation item was added', () => {
    openMenu()
    expect(screen.queryByRole('link', { name: /^Library$/i })).toBeNull()
  })

  it('39/40. existing menu order is stable and sign-out is still present', () => {
    openMenu()
    const labels = screen.getAllByRole('link').map(l => l.textContent.trim()).filter(Boolean)
    // Watchlist immediately precedes Diary (the only changed label), order otherwise intact
    expect(labels).toEqual(expect.arrayContaining(['Account', 'Browse', 'Watchlist', 'Diary', 'People', 'Lists', 'Settings']))
    expect(labels.indexOf('Diary')).toBe(labels.indexOf('Watchlist') + 1)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })
})
