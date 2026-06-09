import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'

import { MovieHero, StickyActionBar, MoodRadar } from '../sections-top'
import { PairsWith, DirectorShelf, TasteTwinReview } from '../sections-bottom'
import { MovieDataProvider } from '../useMovieData'

// MoodRadar observes its section with IntersectionObserver (reveal-on-scroll), which
// jsdom doesn't implement — stub it so the section can mount in the test environment.
beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {} unobserve() {} disconnect() {}
  })
})
afterAll(() => vi.unstubAllGlobals())

// F5.3 — section-level trust pins: the user-match % is gone from the hero, sticky
// bar, Pairs-With, and Director Shelf; daypart + Mood Radar are FeelFlick-owned and
// number-free; the Taste-Twin badge is labelled overall taste similarity.

const MV = {
  id: 496243, tmdb_id: 496243, title: 'Parasite', year: 2019, language: 'KO',
  runtime: 132, director: 'Bong Joon-ho', genres: ['Drama'], poster: '', backdrop: '',
  ffMatch: 88, daypartFit: 'evening', tagline: '', overview: 'A class war.',
  ffCritic: 91, ffAudience: 90, tmdbRating: 8.5, directorId: null, certification: 'R',
}
const withData = (value, node) => render(<MovieDataProvider value={value}>{node}</MovieDataProvider>)

const noop = () => {}
const heroProps = { onPlayTrailer: noop, onBack: noop, onShare: noop, isInWatchlist: false, isWatched: false, onToggleWatchlist: noop, onToggleWatched: noop, loading: false, canAct: true }

describe('Hero / sticky — no user-match number (F5.3)', () => {
  it('31. the hero shows no user-match ring/number (but keeps sourced FF critic/audience %)', () => {
    const { container } = withData({ mv: MV, boundaryWarnings: [] }, <MovieHero {...heroProps} />)
    expect(container.textContent).not.toMatch(/88\s*%/)
    expect(container.querySelector('.ff-movie-match-ring')).toBeNull()
    // sourced critic/audience percentages remain
    expect(container.textContent).toMatch(/91\s*%/)
    expect(container.textContent).toMatch(/90\s*%/)
  })

  it('32. the sticky bar shows no user-match number', () => {
    const { container } = withData({ mv: MV }, <StickyActionBar onPlayTrailer={noop} onBack={noop} onToggleWatchlist={noop} isInWatchlist={false} loading={false} canAct />)
    expect(container.textContent).not.toMatch(/%\s*match/i)
    expect(container.textContent).not.toMatch(/88/)
  })

  it('37-40. daypart is a FeelFlick suggestion, not an objective "Best watched"', () => {
    const { container } = withData({ mv: MV, boundaryWarnings: [] }, <MovieHero {...heroProps} />)
    expect(screen.getByText(/FeelFlick suggests · evening/i)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/best watched/i)
    // accessible label is an explicit FeelFlick-generated suggestion
    expect(screen.getByLabelText(/FeelFlick-generated viewing suggestion: evening/i)).toBeInTheDocument()
  })
})

describe('Pairs With / Director Shelf — no fit badge (F5.3)', () => {
  it('33. Pairs-With cards show no fit percentage', () => {
    const similar = [
      { tmdbId: 1, title: 'A', year: 2020, poster: '', match: 84, why: null, dir: null },
      { tmdbId: 2, title: 'B', year: 2021, poster: '', match: 77, why: null, dir: null },
      { tmdbId: 3, title: 'C', year: 2022, poster: '', match: 66, why: null, dir: null },
    ]
    const { container } = withData({ mv: MV, similar }, <PairsWith goToMovie={noop} />)
    expect(container.textContent).not.toMatch(/84|77|66/)
    expect(container.textContent).not.toMatch(/%/)
  })

  it('34. Director Shelf shows the real user rating but no predicted fit %', () => {
    const dirShelf = [
      { tmdbId: 10, title: 'Mother', year: 2009, poster: '', yourRating: 4 },
      { tmdbId: 11, title: 'The Host', year: 2006, poster: '', yourRating: null },
    ]
    const { container } = withData({ mv: MV, dirShelf }, <DirectorShelf goToMovie={noop} />)
    expect(container.textContent).toMatch(/4★ YOU/)   // real user rating remains
    expect(container.textContent).toMatch(/NEW TO YOU/) // discovery label remains
    expect(container.textContent).not.toMatch(/%/)     // no fit percentage
  })
})

describe('Mood Radar — generated origin, no raw numbers (F5.3)', () => {
  const axes = [
    { name: 'Intensity', weight: 0.8, hex: '#EF4444' },
    { name: 'Pace', weight: 0.6, hex: '#A78BFA' },
    { name: 'Range', weight: 0.5, hex: '#FBBF24' },
  ]

  it('41-43. shows generated-origin disclosure + axis labels, but no raw 0–100 numbers', () => {
    const { container } = render(<MoodRadar axes={axes} highlightMood={null} onHoverAxis={noop} />)
    expect(screen.getByText('FeelFlick mood profile')).toBeInTheDocument()
    expect(screen.getByText(/a generated reading of the film’s tone — not a measured fact/i)).toBeInTheDocument()
    expect(screen.getAllByText('Intensity').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pace').length).toBeGreaterThan(0)
    // the per-axis 0–100 numbers (80, 60, 50) are gone from the axis list — labels only
    const list = container.querySelector('.ff-movie-radar-list')
    expect(list.textContent).not.toMatch(/\d/)
  })
})

describe('Taste Twin — overall taste similarity wording (F5.3)', () => {
  const twin = { name: 'Sam', avatarBg: '#A78BFA', avatarUrl: null, rating: 9, matchPct: 84, note: 'It lingers.', watchedDate: 'Mar 2024' }

  it('46-50. keeps real review + rating, labels the % as OVERALL taste similarity', () => {
    const { container } = render(<TasteTwinReview twin={twin} />)
    expect(screen.getByText('It lingers.', { exact: false })).toBeInTheDocument() // real review text remains
    expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(5)     // star rating remains
    expect(screen.getByText(/84% overall taste similarity/i)).toBeInTheDocument()  // visible explicit label
    expect(screen.getByLabelText(/84% overall taste similarity/i)).toBeInTheDocument() // accessible label
    // never implies film-specific agreement
    expect(container.textContent).not.toMatch(/film match|agreement on this film/i)
    expect(container.textContent).not.toMatch(/84%\s*match\b/i)
  })
})
