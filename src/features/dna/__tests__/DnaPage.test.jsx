import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// DnaPage renders the /profile social profile. All data comes from useDnaProfileData (mocked here).
// Verifies: owner vs visitor chrome, private state, tab deep-link, and NO prototype fiction.

const hook = vi.hoisted(() => ({ state: null }))
vi.mock('../useDnaProfileData', () => ({ useDnaProfileData: () => hook.state }))
vi.mock('@/features/account/useAccountData', () => ({
  AccountDataProvider: ({ children }) => children,
  useAccountData: () => ({ serverSettings: { dnaProfile: {}, privacy: {} }, profile: { name: 'Ada Lovelace' }, updateDnaProfile: () => {}, updatePrivacy: () => {}, saveStatus: {} }),
}))
vi.mock('@/features/people/usePeopleData', () => ({
  PeopleDataProvider: ({ children }) => children,
  usePeopleData: () => ({ user: { followers: 3, following: 5 }, strongest: [], more: [], followingList: [], followingIds: new Set(), follow: () => {}, unfollow: () => {} }),
}))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: { id: 'self-1', user_metadata: {} } }) }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))

import DnaPage from '../DnaPage'

function makeModel(over = {}) {
  return {
    mode: 'owner', isOwner: true,
    identity: { name: 'Ada Lovelace', avatarUrl: null, joinedAt: '2020-01-01', handle: null, bio: 'I watch quietly.', location: 'London', publicProfile: false },
    visibility: {},
    dnaProfile: {},
    stats: { filmsWatched: 42, avgStars: 4.1, reviews: 8, hoursWatched: 71 },
    dna: { forming: false, archetype: ['The Slow-Burner', 'The Class-Conscious', 'The Patient'], tags: ['Tense', 'Dark'], line: 'A portrait built from real films.', title: { lead: 'The Slow-Burner', em: 'The Class-Conscious' } },
    moods: [{ name: 'Tense' }, { name: 'Dark' }],
    directors: [{ name: 'Bong Joon-ho', films: 3, avg: 4.5 }],
    charts: { trendAll: [{ label: '2024', count: 20 }, { label: '2025', count: 22 }], trendYear: [{ label: 'Jan', count: 2 }], ratingBuckets: [], ratingLanguage: null, decades: [{ d: '2010s', pct: 60 }], runtime: null, daypart: [] },
    featured: { myFour: { films: [{ id: 1, title: 'Parasite', posterPath: null }], curated: false, label: 'Selected from your highest-rated films' }, cover: [{ id: 1, title: 'Parasite', posterPath: null }], pinnedReview: null, featuredList: null, currentExploration: null },
    highlights: [],
    activity: [],
    films: [{ id: 1, title: 'Parasite', year: 2019, rating: 9, watchedAt: '2026-03-01' }],
    diary: [], reviews: [], lists: [],
    reputationKnownFor: ['The Slow-Burner', 'Tense'],
    sections: { films: true, diary: true, reviews: true, lists: true, connections: true, viewingRhythm: true },
    ...over,
  }
}

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/profile" element={<DnaPage />} />
      <Route path="/profile/:userId" element={<DnaPage />} />
    </Routes>
  </MemoryRouter>
)

beforeEach(() => { hook.state = { status: 'ready', model: makeModel(), isSelf: true, retry: () => {} } })

describe('DnaPage — owner', () => {
  it('shows owner chrome (Edit profile + View as visitor), never a Follow button', () => {
    renderAt('/profile')
    expect(screen.getByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view as visitor/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^follow$/i })).not.toBeInTheDocument()
  })
  it('renders real stats and contains no prototype fiction', () => {
    renderAt('/profile')
    expect(screen.getAllByText('42').length).toBeGreaterThan(0)
    const html = document.body.innerHTML
    for (const fake of ['Maya', 'mayawatches', '284', '1.8K', 'Toronto']) expect(html).not.toContain(fake)
  })
})

describe('DnaPage — visitor', () => {
  beforeEach(() => { hook.state = { status: 'ready', model: makeModel({ isOwner: false, mode: 'visitor', identity: { ...makeModel().identity, name: 'Grace Hopper', publicProfile: true } }), isSelf: false, retry: () => {} } })
  it('shows Follow + Compare taste, never Edit profile', () => {
    renderAt('/profile/other-1')
    expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /compare taste/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument()
  })
})

describe('DnaPage — private + states', () => {
  it('shows an honest private state', () => {
    hook.state = { status: 'private', model: null, isSelf: false, retry: () => {} }
    renderAt('/profile/other-1')
    expect(screen.getByText(/keeps their profile private/i)).toBeInTheDocument()
  })
  it('deep-links a tab from ?tab=', () => {
    renderAt('/profile?tab=films')
    expect(screen.getByRole('heading', { name: /the film library/i })).toBeInTheDocument()
  })
})
