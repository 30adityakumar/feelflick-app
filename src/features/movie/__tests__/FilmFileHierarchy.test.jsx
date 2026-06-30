import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'

// Stub sections to lightweight markers so we can assert the COMPOSITION ORDER in
// MovieDetail without rendering the heavy internals. FilmFileDisclosure stays real
// (we assert the Film Details disclosure groups Timeline + Details).
vi.mock('../sections-top', () => ({
  ScrollProgress: () => null, FilmGrain: () => null,
  MovieHero: () => <div data-sec="hero"><h1>Parasite</h1></div>,
  StickyActionBar: () => <div data-sec="sticky" />,
  Synopsis: () => <div data-sec="synopsis" />,
  HeroRatings: () => null,
}))
vi.mock('../sections-bottom', () => ({
  CastSection: () => <div data-sec="cast" />, VideosSection: () => <div data-sec="videos" />,
  ProvidersSection: () => <div data-sec="providers" />,
  TimelineSection: () => <div data-sec="timeline" />,
  YourTake: () => <div data-sec="yourtake" />, DetailsSection: () => <div data-sec="details" />,
  MovieFooter: () => <div data-sec="footer" />,
}))
vi.mock('../PrimaryCaseCard', () => ({ default: () => <div data-sec="case" /> }))
vi.mock('../components/DecisionEvidence', () => ({ default: () => <div data-sec="evidence" /> }))
vi.mock('../components/SocialContext', () => ({ default: () => <div data-sec="social" /> }))
vi.mock('../components/ExplorationTail', () => ({ default: () => <div data-sec="explore" /> }))
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
  useMovieDataFetch: () => ({ mv: MV, filmDbRow: null, moodAxes: null, overlay: null, videos: [{ type: 'Trailer', key: 'tr1', name: 'Trailer' }, { type: 'Featurette', key: 'abc', name: 'Test Featurette' }], loading: false, error: null }),
  MovieDataProvider: ({ children }) => children,
  useMovieData: () => ({ mv: MV }),
}))

import MovieDetail from '../MovieDetail'

const FULL_MV = { id: 496243, title: 'Parasite', year: 2019, releaseDate: '2019-05-30', runtime: 132, certification: 'R', language: 'KO', director: 'Bong Joon-ho', languages: ['Korean'], ffMatch: 88 }

beforeEach(() => { cleanup(); document.body.innerHTML = ''; MV = { ...FULL_MV } })
afterEach(() => vi.clearAllMocks())

const order = () => Array.from(document.querySelectorAll('[data-sec]')).map((n) => n.dataset.sec)

describe('Film File hierarchy — decision dossier (F5.5)', () => {
  it('1-8/13. composes the pre-watch sections in the two-column editorial order', () => {
    render(<MovieDetail />)   // locked (unwatched) → no post-watch chapter, no social
    const o = order().filter((s) => s !== 'sticky')
    expect(o).toEqual([
      'hero', 'synopsis', 'cast', 'videos', 'providers', 'timeline', 'details',
      'yourtake', 'explore',
    ])
    // left-column order
    expect(o.indexOf('synopsis')).toBeLessThan(o.indexOf('cast'))
    expect(o.indexOf('cast')).toBeLessThan(o.indexOf('videos'))
    // right-column comes after left-column in source order
    expect(o.indexOf('providers')).toBeLessThan(o.indexOf('yourtake'))
    expect(o.at(-1)).toBe('explore')
  })

  it('41-49. pre-watch tail: Cast → Videos → Providers → Film Details → YourTake → Exploration; social is watched-gated, old sections gone', () => {
    render(<MovieDetail />)
    const o = order()
    expect(o.indexOf('cast')).toBeLessThan(o.indexOf('videos'))
    expect(o.indexOf('videos')).toBeLessThan(o.indexOf('providers'))
    expect(o.indexOf('providers')).toBeLessThan(o.indexOf('timeline'))
    expect(o.indexOf('timeline')).toBeLessThan(o.indexOf('explore'))
    // §18: social proof is NOT in the pre-watch flow — it is watched-gated inside the
    // post-watch chapter, which is not mounted while locked.
    expect(document.querySelector('[data-sec="social"]')).toBeNull()
    // the four old full-page tail sections are no longer independently rendered
    for (const dead of ['friends', 'twin', 'pairs', 'director']) {
      expect(document.querySelector(`[data-sec="${dead}"]`)).toBeNull()
    }
  })

  it('9/10/11/12. exactly one Synopsis, Providers, Your Take, and one page h1', () => {
    render(<MovieDetail />)
    expect(document.querySelectorAll('[data-sec="synopsis"]').length).toBe(1)
    expect(document.querySelectorAll('[data-sec="providers"]').length).toBe(1)
    expect(document.querySelectorAll('[data-sec="yourtake"]').length).toBe(1)
    expect(document.querySelectorAll('h1').length).toBe(1)
  })

  it('55. DetailsSection is omitted from the Film Details card when there are no detail fields', () => {
    MV = { id: 1, title: 'X', languages: ['English'] } // timeline yes (languages), details no
    render(<MovieDetail />)
    expect(document.querySelector('[data-sec="timeline"]')).toBeTruthy()
    expect(document.querySelector('[data-sec="details"]')).toBeNull()
  })

  it('56. the Film Details card self-hides when there is nothing to show', () => {
    MV = { id: 1, title: 'X' } // no releaseDate / runtime / cert / languages / etc.
    render(<MovieDetail />)
    expect(document.querySelector('[data-sec="timeline"]')).toBeNull()
    expect(document.querySelector('[data-sec="details"]')).toBeNull()
  })
})
