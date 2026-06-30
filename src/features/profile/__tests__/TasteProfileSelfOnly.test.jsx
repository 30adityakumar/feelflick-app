import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// F7.2 privacy containment (updated): /profile/:userId for another user now renders
// PublicDnaProfile (SECURITY DEFINER RPCs only) — NOT the self DNA hook.
// The key security invariant is unchanged: useProfileDataFetch (owner-only table reads) is
// NEVER called for a non-self user. Cross-user data flows through the public RPCs only.

const fetchSpy = vi.fn(() => ({ loading: true, error: null }))
vi.mock('../useProfileData', () => ({
  useProfileDataFetch: (args) => fetchSpy(args),
  ProfileDataProvider: ({ children }) => children,
  useProfileData: () => ({}),
}))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: { id: 'self-1' } }) }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))

// Mock the DNA hook used by PublicDnaProfile for cross-user renders
vi.mock('../hooks/usePublicDna', () => ({
  usePublicDna: () => ({ status: 'loading', profile: null, raw: null, tasteRows: [], retry: () => {} }),
}))
// Mock people data provider so PeopleDataProvider renders children without Supabase
vi.mock('@/features/people/usePeopleData', () => ({
  PeopleDataProvider: ({ children }) => children,
  usePeopleData: () => ({ followingIds: new Set(), follow: () => {}, unfollow: () => {}, isPending: () => false, isErrored: () => false }),
}))
vi.mock('@/features/people/hooks/usePersonPublicProfile', () => ({
  usePersonPublicProfile: () => ({ status: 'loading', profile: null, history: [], watchlist: [], lists: [], similarity: null, retry: () => {} }),
}))

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

describe('TasteProfile — F7.2 privacy containment', () => {
  it("another user's /profile/:userId renders PersonPublicProfile and NEVER calls the owner-only data hook", () => {
    renderAt('/profile/other-1')
    // The decisive security assertion: no cross-user history/ratings/similarity query ran via the owner-only hook
    expect(fetchSpy).not.toHaveBeenCalled()
    // PersonPublicProfile is rendered — shows the Back to People nav link
    expect(screen.getByRole('link', { name: /back to people/i })).toBeInTheDocument()
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

  it('a fresh visit to another user (no prior self render) never calls the owner-only data hook', () => {
    renderAt('/profile/other-2')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: /back to people/i })).toBeInTheDocument()
  })
})
