import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const navigate = vi.fn()
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }))
vi.mock('@/shared/hooks/useAuthSession', () => ({
  useAuthSession: () => ({ user: { id: 'u1', email: 'ada@b.com', user_metadata: { name: 'Ada Lovelace' } } }),
}))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { auth: { signOut: vi.fn(async () => ({ error: null })) } },
}))
vi.mock('@/features/onboarding/draft', () => ({ clearDraft: vi.fn() }))

import YouMenu from '../YouMenu'
import { supabase } from '@/shared/lib/supabase/client'
import { clearDraft } from '@/features/onboarding/draft'

const renderPage = () => render(<MemoryRouter><YouMenu /></MemoryRouter>)

beforeEach(() => vi.clearAllMocks())
afterEach(() => cleanup())

describe('YouMenu — mobile account hub', () => {
  it('shows the profile header (name + email) and one h1', () => {
    renderPage()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('ada@b.com')).toBeInTheDocument()
  })

  it('renders every account destination wired to its real route', () => {
    renderPage()
    const expected = {
      Account: '/account',
      Browse: '/browse',
      Watchlist: '/watchlist',
      Diary: '/history',
      People: '/people',
      Lists: '/lists',
      Settings: '/preferences',
    }
    for (const [label, href] of Object.entries(expected)) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', href)
    }
  })

  it('offers Send feedback as a mailto link', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /send feedback/i }))
      .toHaveAttribute('href', expect.stringMatching(/^mailto:/))
  })

  it('signs out: clears the draft, calls supabase signOut, returns to /', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(clearDraft).toHaveBeenCalledWith('u1')
    await waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/'))
  })
})
