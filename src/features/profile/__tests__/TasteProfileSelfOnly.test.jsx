import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// F7.2 privacy containment: a Cinematic DNA profile is owner-private. Viewing
// /profile/:userId for ANYONE other than the signed-in user must render a private state
// and must NOT fetch the target user's history / ratings / similarity / editorial. (The
// authoritative boundary is the owner-only RLS in 20260609000000_*; this is defense-in-depth.)

const fetchSpy = vi.fn(() => ({ loading: true, error: null }))
vi.mock('../useProfileData', () => ({
  useProfileDataFetch: (args) => fetchSpy(args),
  ProfileDataProvider: ({ children }) => children,
  useProfileData: () => ({}),
}))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: { id: 'self-1' } }) }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))

import TasteProfile from '../TasteProfile'

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/profile" element={<TasteProfile />} />
      <Route path="/profile/:userId" element={<TasteProfile />} />
    </Routes>
  </MemoryRouter>
)

beforeEach(() => fetchSpy.mockClear())

describe('TasteProfile — F7.2 self-only privacy containment', () => {
  it("another user's /profile/:userId renders the private state and fetches NOTHING", () => {
    renderAt('/profile/other-1')
    // one h1, honest private copy, no behavioral data
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/private/i)
    // the decisive assertion: no cross-user history/ratings/similarity/editorial query ran
    expect(fetchSpy).not.toHaveBeenCalled()
    // keyboard-accessible recovery to safe surfaces
    expect(screen.getByRole('link', { name: /your cinematic dna/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /people/i })).toBeInTheDocument()
  })

  it("the signed-in user's own /profile fetches self only (isSelf=true)", () => {
    renderAt('/profile')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({ userId: 'self-1', isSelf: true }))
    expect(screen.queryByText(/this profile is private/i)).not.toBeInTheDocument()
  })

  it('/profile/:ownId (own id in the route param) is treated as self', () => {
    renderAt('/profile/self-1')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({ userId: 'self-1', isSelf: true }))
    expect(screen.queryByText(/this profile is private/i)).not.toBeInTheDocument()
  })

  it('a fresh visit to another user (no prior self render) still fetches nothing', () => {
    renderAt('/profile/other-2')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/private/i)
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
