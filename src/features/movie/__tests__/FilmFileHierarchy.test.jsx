import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

// Stub sections to lightweight markers so we can assert the COMPOSITION ORDER in
// MovieDetail without rendering the heavy internals. FilmFileDisclosure stays real
// (we assert the Film Details disclosure groups Timeline + Details).
vi.mock('../sections-top', () => ({
  ScrollProgress: () => null, FilmGrain: () => null,
  MovieHero: () => <div data-sec="hero"><h1>Parasite</h1></div>,
  StickyActionBar: () => <div data-sec="sticky" />,
  Synopsis: () => <div data-sec="synopsis" />,
}))
vi.mock('../sections-bottom', () => ({
  CastSection: () => <div data-sec="cast" />, VideosSection: () => <div data-sec="videos" />,
  ProvidersSection: () => <div data-sec="providers" />, PairsWith: () => <div data-sec="pairs" />,
  FriendsLoved: () => <div data-sec="friends" />, TasteTwinReview: () => <div data-sec="twin" />,
  TimelineSection: () => <div data-sec="timeline" />, DirectorShelf: () => <div data-sec="director" />,
  YourTake: () => <div data-sec="yourtake" />, DetailsSection: () => <div data-sec="details" />,
  MovieFooter: () => <div data-sec="footer" />,
}))
vi.mock('../PrimaryCaseCard', () => ({ default: () => <div data-sec="case" /> }))
vi.mock('../components/DecisionEvidence', () => ({ default: () => <div data-sec="evidence" /> }))
vi.mock('../components/AccessibleMediaDialog', () => ({ default: () => null }))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: { id: 'u1' } }) }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/shared/hooks/useUserMovieStatus', () => ({ useUserMovieStatus: () => ({ isInWatchlist: false, isWatched: false, loading: {}, toggleWatchlist: vi.fn(), toggleWatched: vi.fn(), internalId: 7 }) }))
vi.mock('@/shared/services/interactions', () => ({ trackShare: vi.fn(), trackTrailerPlay: vi.fn() }))
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn(), useParams: () => ({ id: '496243' }) }))
vi.mock('../hooks/useTasteFingerprint', () => ({ useTasteFingerprint: () => ({ fingerprint: null }) }))
vi.mock('../hooks/useDirectorAffinity', () => ({ useDirectorAffinity: () => ({ count: 0 }) }))
vi.mock('../hooks/useFriendsLoved', () => ({ useFriendsLoved: () => ({ friends: [] }) }))
vi.mock('../hooks/useTasteTwin', () => ({ useTasteTwin: () => ({ twin: null }) }))

let MV = {}
vi.mock('../useMovieData', () => ({
  useMovieDataFetch: () => ({ mv: MV, filmDbRow: null, moodAxes: null, overlay: null, loading: false, error: null }),
  MovieDataProvider: ({ children }) => children,
  useMovieData: () => ({ mv: MV }),
}))

import MovieDetail from '../MovieDetail'

const FULL_MV = { id: 496243, title: 'Parasite', year: 2019, releaseDate: '2019-05-30', runtime: 132, certification: 'R', language: 'KO', director: 'Bong Joon-ho', languages: ['Korean'], ffMatch: 88 }

beforeEach(() => { cleanup(); document.body.innerHTML = ''; MV = { ...FULL_MV } })
afterEach(() => vi.clearAllMocks())

const order = () => Array.from(document.querySelectorAll('[data-sec]')).map((n) => n.dataset.sec)

describe('Film File hierarchy — decision dossier (F5.5)', () => {
  it('1-8/13. composes the sections in the decision-first order', () => {
    render(<MovieDetail />)
    const o = order().filter((s) => s !== 'sticky')
    expect(o).toEqual([
      'hero', 'case', 'synopsis', 'providers', 'yourtake', 'evidence',
      'videos', 'friends', 'twin', 'pairs', 'cast', 'director', 'timeline', 'details', 'footer',
    ])
    // key adjacencies
    expect(o.indexOf('case')).toBeLessThan(o.indexOf('synopsis'))
    expect(o.indexOf('synopsis')).toBeLessThan(o.indexOf('providers'))
    expect(o.indexOf('providers')).toBeLessThan(o.indexOf('yourtake'))
    expect(o.indexOf('yourtake')).toBeLessThan(o.indexOf('evidence'))
    expect(o.indexOf('evidence')).toBeLessThan(o.indexOf('videos'))
    expect(o.indexOf('director')).toBeLessThan(o.indexOf('timeline'))
    expect(o.at(-1)).toBe('footer')
  })

  it('9/10/11/12. exactly one Synopsis, Providers, Your Take, and one page h1', () => {
    render(<MovieDetail />)
    expect(document.querySelectorAll('[data-sec="synopsis"]').length).toBe(1)
    expect(document.querySelectorAll('[data-sec="providers"]').length).toBe(1)
    expect(document.querySelectorAll('[data-sec="yourtake"]').length).toBe(1)
    expect(document.querySelectorAll('h1').length).toBe(1)
  })

  it('51/52. Timeline + Details are grouped under one collapsed "Film details" disclosure', () => {
    render(<MovieDetail />)
    const summary = screen.getByText('Film details')
    const details = summary.closest('details')
    expect(details.open).toBe(false)
    // both grouped inside
    expect(details.querySelector('[data-sec="timeline"]')).toBeTruthy()
    expect(details.querySelector('[data-sec="details"]')).toBeTruthy()
  })

  it('55. Details is omitted from the disclosure when there are no detail fields', () => {
    MV = { id: 1, title: 'X', languages: ['English'] } // timeline yes (languages), details no
    render(<MovieDetail />)
    const details = screen.getByText('Film details').closest('details')
    expect(details.querySelector('[data-sec="timeline"]')).toBeTruthy()
    expect(details.querySelector('[data-sec="details"]')).toBeNull()
  })

  it('56. the Film Details disclosure self-hides when there is nothing to show', () => {
    MV = { id: 1, title: 'X' } // no releaseDate / runtime / cert / languages / etc.
    render(<MovieDetail />)
    expect(screen.queryByText('Film details')).not.toBeInTheDocument()
  })
})
