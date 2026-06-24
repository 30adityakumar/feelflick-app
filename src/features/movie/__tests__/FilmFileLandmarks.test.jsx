import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

vi.mock('../sections-top', () => ({
  ScrollProgress: () => null, FilmGrain: () => null,
  MovieHero: () => <header data-sec="hero"><h1>Parasite</h1></header>,
  StickyActionBar: () => <div data-sec="sticky"><button type="button">sticky</button></div>,
  Synopsis: () => <div data-sec="synopsis" />,
}))
vi.mock('../sections-bottom', () => ({
  CastSection: () => <div data-sec="cast" />, VideosSection: () => <div data-sec="videos" />,
  ProvidersSection: () => <div data-sec="providers" />, TimelineSection: () => <div data-sec="timeline" />,
  YourTake: () => <div data-sec="yourtake" />, DetailsSection: () => <div data-sec="details" />,
  MovieFooter: () => <div data-sec="footer" />,
}))
vi.mock('../PrimaryCaseCard', () => ({ default: () => <div data-sec="case" /> }))
vi.mock('../components/DecisionEvidence', () => ({ default: () => <div data-sec="evidence" /> }))
vi.mock('../components/SocialContext', () => ({ default: () => <div data-sec="social" /> }))
vi.mock('../components/ExplorationTail', () => ({ default: () => <div data-sec="explore" /> }))
vi.mock('../components/AccessibleMediaDialog', () => ({ default: () => null }))
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn(), useParams: () => ({ id: '496243' }) }))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: { id: 'u1' } }) }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/shared/hooks/useUserMovieStatus', () => ({ useUserMovieStatus: () => ({ isInWatchlist: false, isWatched: false, loading: {}, toggleWatchlist: vi.fn(), toggleWatched: vi.fn(), internalId: 7 }) }))
vi.mock('@/shared/services/interactions', () => ({ trackShare: vi.fn(), trackTrailerPlay: vi.fn() }))
vi.mock('framer-motion', () => ({ useReducedMotion: () => false }))
vi.mock('../hooks/useTasteFingerprint', () => ({ useTasteFingerprint: () => ({ fingerprint: null }) }))
vi.mock('../hooks/useDirectorAffinity', () => ({ useDirectorAffinity: () => ({ count: 0 }) }))
vi.mock('../hooks/useFriendsLoved', () => ({ useFriendsLoved: () => ({ friends: [] }) }))
vi.mock('../hooks/useTasteTwin', () => ({ useTasteTwin: () => ({ twin: null }) }))

let DATA = { mv: { id: 1, title: 'Parasite', releaseDate: '2019-05-30', runtime: 132 }, filmDbRow: null, moodAxes: null, overlay: null, similar: [], dirShelf: [], loading: false, error: null }
vi.mock('../useMovieData', () => ({
  useMovieDataFetch: () => DATA,
  MovieDataProvider: ({ children }) => children,
  useMovieData: () => ({ mv: DATA.mv }),
}))

import MovieDetail from '../MovieDetail'

beforeEach(() => { cleanup(); document.body.innerHTML = ''; DATA = { ...DATA, loading: false, error: null } })
afterEach(() => vi.clearAllMocks())

describe('Film File — skip link + main landmark (F5.7)', () => {
  it('48/49/50. the skip link is the first focusable element with the right label + target', () => {
    const { container } = render(<MovieDetail />)
    const focusables = container.querySelectorAll('a[href], button')
    expect(focusables[0].tagName).toBe('A')
    expect(focusables[0]).toHaveAttribute('href', '#film-file-content')
    expect(focusables[0]).toHaveTextContent('Skip to Film File content')
  })

  it('51/52/53. MovieDetail renders NO page <main> (AppShell owns it); the skip target is a labelled region with tabIndex -1', () => {
    const { container } = render(<MovieDetail />)
    // §5: AppShell owns the only page <main>; the route must NOT add a nested one.
    expect(container.querySelectorAll('main').length).toBe(0)
    const region = container.querySelector('#film-file-content')
    expect(region.tagName).toBe('SECTION')
    expect(region).toHaveAttribute('role', 'region')
    expect(region).toHaveAttribute('aria-label', 'Film File')
    expect(region).toHaveAttribute('tabindex', '-1')
  })

  it('54/55/56/57. Hero is before the region; PrimaryCase begins it; Footer is inside it; sticky is outside', () => {
    const { container } = render(<MovieDetail />)
    const hero = container.querySelector('[data-sec="hero"]')
    const region = container.querySelector('#film-file-content')
    expect(hero.compareDocumentPosition(region) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy() // hero before region
    expect(region.contains(hero)).toBe(false)                                  // hero NOT in region
    expect(region.querySelector('[data-sec="case"]')).toBeTruthy()             // case begins region
    expect(region.querySelector('[data-sec="footer"]')).toBeTruthy()           // footer inside region
    expect(region.contains(container.querySelector('[data-sec="sticky"]'))).toBe(false) // sticky outside
  })

  it('71. exactly one h1', () => {
    const { container } = render(<MovieDetail />)
    expect(container.querySelectorAll('h1').length).toBe(1)
  })
})

describe('Film File — loading skeleton semantics (F5.7)', () => {
  it('59/60/61/62/63. status + aria-busy + one sr-only message + decorative blocks, no progress', () => {
    DATA = { ...DATA, loading: true }
    const { container } = render(<MovieDetail />)
    const status = container.querySelector('[role="status"]')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText('Loading Film File…')).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy() // decorative blocks hidden
    expect(container.textContent).not.toMatch(/\d+\s*%/)                  // no progress percentage
  })
})
