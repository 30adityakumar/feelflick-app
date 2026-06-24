import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'

// Heavy / unrelated sections stubbed; the spoiler-relevant components (SpoilerBoundary,
// PostWatchPortrait → Parasite/Generic, ViewerNotes, SocialContext, MovieChapterNav)
// render FOR REAL so we test the actual gating.
vi.mock('../sections-top', () => ({
  ScrollProgress: () => null, FilmGrain: () => null,
  MovieHero: () => <header data-sec="hero"><h1>Test Film</h1></header>,
  StickyActionBar: () => <div data-sec="sticky" />,
  Synopsis: () => <div data-sec="synopsis" />,
}))
vi.mock('../sections-bottom', () => {
  const Stub = () => null
  return { CastSection: Stub, VideosSection: Stub, ProvidersSection: Stub, TimelineSection: Stub, YourTake: () => <div data-sec="yourtake" />, DetailsSection: Stub, MovieFooter: () => <div data-sec="footer" /> }
})
vi.mock('../PrimaryCaseCard', () => ({ default: () => <div data-sec="case" /> }))
vi.mock('../components/DecisionEvidence', () => ({ default: () => <div data-sec="evidence" /> }))
vi.mock('../components/ExplorationTail', () => ({ default: () => <div data-sec="explore" /> }))
vi.mock('../components/AccessibleMediaDialog', () => ({ default: () => null }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/shared/services/interactions', () => ({ trackShare: vi.fn(), trackTrailerPlay: vi.fn() }))
// useParams id is irrelevant here — useMovieDataFetch is mocked and the Parasite gate
// reads mv.id (from the useMovieData mock below), not the route param.
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn(), useParams: () => ({ id: '1' }) }))
vi.mock('../hooks/useTasteFingerprint', () => ({ useTasteFingerprint: () => ({ fingerprint: null }) }))
vi.mock('../hooks/useDirectorAffinity', () => ({ useDirectorAffinity: () => ({ count: 0 }) }))

// Auth + status are mutable per test.
const auth = { user: { id: 'u1' } }
const status = { isInWatchlist: false, isWatched: false, loading: { watchlist: false, watched: false }, internalId: 7 }
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: auth.user }) }))
vi.mock('@/shared/hooks/useUserMovieStatus', () => ({
  useUserMovieStatus: () => ({ ...status, toggleWatchlist: vi.fn(), toggleWatched: vi.fn() }),
}))

// Social hooks ALWAYS return data; the redesign must gate them by MOUNT (post-watch
// chapter), so the friend/twin text must never appear pre-watch even with data present.
const FRIEND = { id: 'f1', name: 'Alex', avatarBg: '#222', avatarUrl: null, rating: 9, reviewText: 'Loved the ending twist' }
const TWIN = { id: 't1', name: 'Hidden', avatarBg: '#333', avatarUrl: null, rating: 8, note: 'Stayed with me for days', watchedDate: 'Mar 2024' }
vi.mock('../hooks/useFriendsLoved', () => ({ useFriendsLoved: () => ({ friends: [FRIEND] }) }))
vi.mock('../hooks/useTasteTwin', () => ({ useTasteTwin: () => ({ twin: TWIN }) }))

let MV = { id: 1, title: 'Test Film', releaseDate: '2020-01-01', runtime: 120 }
let OVERLAY = { critic_quotes: [{ quote: 'A tense, brilliant ride.' }] }
vi.mock('../useMovieData', () => ({
  useMovieDataFetch: () => ({ mv: MV, filmDbRow: null, moodAxes: null, overlay: OVERLAY, similar: [], dirShelf: [], loading: false, error: null }),
  MovieDataProvider: ({ children }) => children,
  useMovieData: () => ({ mv: MV }),
}))

import MovieDetail from '../MovieDetail'

const PARASITE_PHRASE = /descent disguised/i

beforeEach(() => {
  cleanup(); document.body.innerHTML = ''
  auth.user = { id: 'u1' }
  status.isWatched = false; status.loading = { watchlist: false, watched: false }
  MV = { id: 1, title: 'Test Film', releaseDate: '2020-01-01', runtime: 120 }
  OVERLAY = { critic_quotes: [{ quote: 'A tense, brilliant ride.' }] }
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
})
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks() })

describe('Film File — spoiler safety (§15/§16/§18/§19)', () => {
  it('pre-watch (signed in): no post-watch DOM, no friend/twin/impression text, no spoiler nav link, boundary shown', () => {
    const { container } = render(<MovieDetail />)
    // post-watch chapter not mounted
    expect(container.querySelector('#after-watching')).toBeNull()
    // spoiler boundary IS shown
    expect(screen.getByText(/The page stops here/i)).toBeInTheDocument()
    // no friend/twin/impression text anywhere pre-watch
    expect(container.textContent).not.toContain('Loved the ending twist')
    expect(container.textContent).not.toContain('Stayed with me for days')
    expect(container.textContent).not.toContain('A tense, brilliant ride.')
    expect(container.textContent).not.toMatch(/FeelFlick impressions/i)
    // chapter nav has no "After watching" link in the a11y tree
    expect(screen.queryByRole('link', { name: /after watching/i })).toBeNull()
  })

  it('anonymous: same locked state, boundary copy invites sign-in', () => {
    auth.user = null
    const { container } = render(<MovieDetail />)
    expect(container.querySelector('#after-watching')).toBeNull()
    expect(screen.getByText(/Sign in and mark this film watched/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /after watching/i })).toBeNull()
  })

  it('a direct #after-watching hash cannot reveal spoilers while locked (target is absent)', () => {
    window.location.hash = '#after-watching'
    const { container } = render(<MovieDetail />)
    expect(container.querySelector('#after-watching')).toBeNull()
    window.location.hash = ''
  })

  it('watched + non-Parasite: honest generic state, NO fabricated interpretation, friend/twin/impression now shown', async () => {
    status.isWatched = true
    const { container } = render(<MovieDetail />)
    expect(container.querySelector('#after-watching')).toBeInTheDocument()
    expect(screen.getByText(/does not yet have a curated post-watch portrait/i)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(PARASITE_PHRASE)
    // watched-gated content now appears
    expect(container.textContent).toContain('Loved the ending twist')
    expect(container.textContent).toContain('Stayed with me for days')
    expect(container.textContent).toContain('A tense, brilliant ride.')
    // "After watching" chapter link now exists
    expect(screen.getByRole('link', { name: /after watching/i })).toBeInTheDocument()
    // §20: no exact similarity %
    expect(container.textContent).not.toMatch(/\d+\s*%/)
  })

  it('watched + Parasite (496243): curated portrait lazy-loads; never leaks to other ids', async () => {
    MV = { id: 496243, title: 'Parasite', releaseDate: '2019-05-30', runtime: 132 }
    status.isWatched = true
    const { container } = render(<MovieDetail />)
    await waitFor(() => expect(container.textContent).toMatch(PARASITE_PHRASE))
    expect(screen.getByText(/A FeelFlick reading/i)).toBeInTheDocument()
    // no fabricated awards/critic %/DNA delta
    expect(container.textContent).not.toMatch(/rotten tomatoes|oscar|won \d|\d+%/i)
  })

  it('Parasite curated text NEVER appears for a different watched film', () => {
    MV = { id: 777, title: 'Other Film', releaseDate: '2021-01-01', runtime: 100 }
    status.isWatched = true
    const { container } = render(<MovieDetail />)
    expect(container.textContent).not.toMatch(PARASITE_PHRASE)
    expect(screen.getByText(/does not yet have a curated post-watch portrait/i)).toBeInTheDocument()
  })
})
