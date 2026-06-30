import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// PublicDnaProfile renders another user's FULL Cinematic DNA portrait (read-only, third-person),
// driven entirely by the public SECURITY DEFINER RPCs (usePublicDna) — never the owner-only
// self fetch. These tests verify: the analytical sections render with third-person copy, the
// owner-only controls are absent, and a Follow control is present.

// Stub IntersectionObserver for DnaSectionNav (jsdom has none).
beforeAll(() => {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

// Mutable hook state, swapped per test (hoisted so the vi.mock factory can read it).
const hook = vi.hoisted(() => ({ state: null }))

// 12 watched films, 3 by Bong Joon-ho (→ Voices), all rated (→ Response eligible).
const TASTE_ROWS = Array.from({ length: 12 }, (_, i) => {
  const bong = i < 3
  return {
    movie_id: 100 + i,
    title: bong ? `Bong Film ${i}` : `Film ${i}`,
    poster_path: `/p${i}.jpg`,
    release_date: `20${10 + i}-01-01`,
    director_name: bong ? 'Bong Joon-ho' : `Director ${i}`,
    runtime: 110,
    mood_tags: ['tense', 'bittersweet'],
    tone_tags: ['earnest'],
    tmdb_id: 5000 + i,
    watched_at: `2024-0${(i % 9) + 1}-15T00:00:00Z`,
    rating: 8 + (i % 3), // 8,9,10 → eligible distribution, some 5-star
  }
})

const PROFILE = { id: 'other-1', name: 'Devarshi Shah', avatar_url: null, share_history: true, share_watchlist: true }
const RAW = {
  name: 'Devarshi Shah',
  avatar_url: null,
  editorial_archetype: ['The Slow-Burner', 'The Class-Conscious', 'The Patient'],
  editorial_summary: null,
  editorial_signature: null,
  editorial_generated_at: null,
  taste_fingerprint: { topMoodTags: [{ key: 'tense', share: 0.4, count: 8 }, { key: 'dark', share: 0.3, count: 6 }] },
  total_watched: 44,
  total_rated: 16,
}

vi.mock('../hooks/usePublicDna', () => ({ usePublicDna: () => hook.state }))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: { id: 'viewer' } }) }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/features/people/usePeopleData', () => ({
  PeopleDataProvider: ({ children }) => children,
  usePeopleData: () => ({ followingIds: new Set(), follow: () => {}, unfollow: () => {}, isPending: () => false, isErrored: () => false }),
}))
vi.mock('@/features/people/hooks/usePersonPublicProfile', () => ({
  usePersonPublicProfile: () => ({ status: 'ready', profile: PROFILE, history: [], watchlist: [], lists: [], similarity: null, retry: () => {} }),
}))

import PublicDnaProfile from '../PublicDnaProfile'

const renderAt = (path = '/profile/other-1') => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/profile/:userId" element={<PublicDnaProfile />} />
    </Routes>
  </MemoryRouter>
)

describe('PublicDnaProfile — full read-only portrait for another user', () => {
  beforeEach(() => { hook.state = { status: 'ok', profile: PROFILE, raw: RAW, tasteRows: TASTE_ROWS, retry: () => {} } })

  it('renders the archetype hero with third-person deterministic copy', () => {
    renderAt()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Slow-Burner/)
    expect(screen.getByText(/A portrait built from the films they actually watch and rate\./i)).toBeInTheDocument()
  })

  it('renders Response and Voices with third-person copy (subjectName)', () => {
    renderAt()
    expect(screen.getByText(/Devarshi's rating language/)).toBeInTheDocument()
    expect(screen.getByText('The voices they trust.')).toBeInTheDocument()
    expect(screen.getAllByText(/Bong Joon-ho/).length).toBeGreaterThan(0)
  })

  it('omits owner-only controls (Private pill, evidence trigger, passport export, self CTA label)', () => {
    renderAt()
    expect(screen.queryByText('Private')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /why this read/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /save passport image/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /explore your dna/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^explore dna$/i })).toBeInTheDocument()
  })

  it('offers a Follow action and the social sections', () => {
    renderAt()
    expect(screen.getByRole('button', { name: /follow devarshi shah/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Watch history' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Watchlist' })).toBeInTheDocument()
  })
})

describe('PublicDnaProfile — privacy', () => {
  it('shows a neutral notice (no portrait) when the user keeps DNA private', () => {
    hook.state = { status: 'private', profile: PROFILE, raw: null, tasteRows: [], retry: () => {} }
    renderAt()
    expect(screen.getByText(/keeps their Cinematic DNA private/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
  })
})

describe('PublicDnaProfile — maturity from real rows, not a stale count', () => {
  it('does NOT read as "still forming" when the count column is 0 but taste rows are present', () => {
    // Regression: users.total_movies_watched can be stale at 0 while the real history exists.
    // Maturity must come from max(actual rows, count), so the portrait renders, not "forming".
    hook.state = {
      status: 'ok',
      profile: PROFILE,
      raw: { ...RAW, total_watched: 0, total_rated: 0 },
      tasteRows: TASTE_ROWS,
      retry: () => {},
    }
    renderAt()
    expect(screen.queryByText(/still forming/i)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Slow-Burner/)
  })
})
