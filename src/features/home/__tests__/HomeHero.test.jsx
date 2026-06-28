import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// --- mocks ------------------------------------------------------------------
const navigate = vi.fn()
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }))

const toggleWatchlist = vi.fn()
const toggleWatched = vi.fn()
const movieStatus = { isInWatchlist: false, isWatched: false, loading: { watchlist: false, watched: false }, toggleWatchlist, toggleWatched, internalId: 1 }
vi.mock('@/shared/hooks/useUserMovieStatus', () => ({ useUserMovieStatus: () => ({ ...movieStatus, internalId: movieStatus.internalId }) }))

const updateImpression = vi.fn(() => Promise.resolve())
const logSurfaceImpressions = vi.fn(() => Promise.resolve())
vi.mock('@/shared/services/recommendations', () => ({
  updateImpression: (...a) => updateImpression(...a),
  logSurfaceImpressions: (...a) => logSurfaceImpressions(...a),
}))
const recordRecommendationOutcome = vi.fn(() => Promise.resolve())
vi.mock('@/shared/services/recommendationOutcomes', () => ({ recordRecommendationOutcome: (...a) => recordRecommendationOutcome(...a) }))
const trackInteraction = vi.fn(() => Promise.resolve())
vi.mock('@/shared/services/interactions', () => ({ trackInteraction: (...a) => trackInteraction(...a) }))
vi.mock('@/shared/api/tmdb', () => ({ backdropImg: () => 'http://x/bg.jpg', backdropSrcSet: () => '' }))

import HomeHero from '../components/HomeHero'

const FILMS = [
  { id: 1, tmdb_id: 101, title: 'Alpha', release_year: 2020, runtime: 132, primary_genre: 'Drama', director_name: 'Dir A', backdrop_path: '/a.jpg', _reason: { type: 'director', text: 'More from Dir A' } },
  { id: 2, tmdb_id: 102, title: 'Beta', release_year: 2021, runtime: 95, primary_genre: 'Sci-Fi', director_name: 'Dir B', backdrop_path: '/b.jpg', _reason: { type: 'seed', text: 'Because you loved X' } },
  { id: 3, tmdb_id: 103, title: 'Gamma', release_year: 2019, runtime: 110, primary_genre: 'Romance', director_name: 'Dir C', backdrop_path: '/c.jpg', _reason: { type: 'mood', text: 'Matches your taste for tender films' } },
]
const USER = { id: 'u1' }
const renderHero = (films = FILMS) => render(<MemoryRouter><HomeHero films={films} user={USER} /></MemoryRouter>)

beforeEach(() => { vi.clearAllMocks(); movieStatus.isInWatchlist = false; movieStatus.isWatched = false; movieStatus.internalId = 1 })

describe('HomeHero — carousel navigation + active film', () => {
  it('renders the first standout with its grounded reason and lean meta (year · genre · runtime)', () => {
    renderHero()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Alpha')
    expect(screen.getByText('More from Dir A')).toBeInTheDocument() // grounded reason leads
    expect(screen.getByText('2020')).toBeInTheDocument()            // year
    expect(screen.getByText('Drama')).toBeInTheDocument()           // genre (primary_genre)
    expect(screen.getByText('2h 12m')).toBeInTheDocument()          // runtime
    // Director is no longer a standalone meta chip (it lives in the reason / Film File).
    expect(screen.queryByText('Dir A')).not.toBeInTheDocument()
  })

  it('next / prev arrows change the active film (and wrap)', () => {
    renderHero()
    fireEvent.click(screen.getByLabelText('Next featured film'))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Beta')
    expect(screen.getByText('Because you loved X')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Previous featured film'))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Alpha')
    fireEvent.click(screen.getByLabelText('Previous featured film')) // wrap to last
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Gamma')
  })

  it('dots jump directly to a standout', () => {
    renderHero()
    fireEvent.click(screen.getByLabelText('Show featured film 3 of 3'))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Gamma')
  })

  it('logs a hero impression for each active film as it changes', async () => {
    renderHero()
    await waitFor(() => expect(logSurfaceImpressions).toHaveBeenCalled())
    expect(logSurfaceImpressions).toHaveBeenLastCalledWith(expect.objectContaining({ placement: 'hero', films: [{ id: 1 }] }))
    fireEvent.click(screen.getByLabelText('Next featured film'))
    await waitFor(() => expect(logSurfaceImpressions).toHaveBeenLastCalledWith(expect.objectContaining({ placement: 'hero', films: [{ id: 2 }] })))
  })

  it('single standout shows no arrows or dots', () => {
    renderHero([FILMS[0]])
    expect(screen.queryByLabelText('Next featured film')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Show featured film/)).not.toBeInTheDocument()
  })
})

describe('HomeHero — language + description', () => {
  it('adds the spoken language to the meta for a non-English film', () => {
    renderHero([{ ...FILMS[0], original_language: 'fr' }])
    expect(screen.getByText('French')).toBeInTheDocument()
    // factual meta still present
    expect(screen.getByText('2020')).toBeInTheDocument()
    expect(screen.getByText('Drama')).toBeInTheDocument()
  })

  it('does not show a language chip for an English film', () => {
    renderHero([{ ...FILMS[0], original_language: 'en' }])
    expect(screen.queryByText('English')).not.toBeInTheDocument()
    expect(screen.queryByText('EN')).not.toBeInTheDocument()
  })

  it('falls back to the upper-cased code for an unknown language', () => {
    renderHero([{ ...FILMS[0], original_language: 'zz' }])
    expect(screen.getByText('ZZ')).toBeInTheDocument()
  })

  it('renders the movie description when an overview is present', () => {
    const { container } = renderHero([{ ...FILMS[0], overview: 'A rancher torments his brother’s new wife.' }])
    const desc = container.querySelector('.ff-hero__description')
    expect(desc).toBeInTheDocument()
    expect(desc).toHaveTextContent('A rancher torments his brother’s new wife.')
  })

  it('omits the description when there is no overview (and ignores whitespace)', () => {
    const { container, rerender } = renderHero()
    expect(container.querySelector('.ff-hero__description')).not.toBeInTheDocument()
    rerender(<MemoryRouter><HomeHero films={[{ ...FILMS[0], overview: '   ' }]} user={USER} /></MemoryRouter>)
    expect(container.querySelector('.ff-hero__description')).not.toBeInTheDocument()
  })
})

describe('HomeHero — official title logo', () => {
  const LOGO = 'https://image.tmdb.org/t/p/original/cjSEGVvYryWuHA5jjdGy4WSaTWF.png'
  const withLogo = (extra = {}) => [{ ...FILMS[0], titleLogoUrl: LOGO, ...extra }]

  it('shows the text title until the logo loads, then swaps to the decorative logo (title stays an accessible heading)', () => {
    const { container } = renderHero(withLogo())
    const img = container.querySelector('.ff-hero__title-logo')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('alt', '')                 // decorative — not a second title for SR
    expect(img).toHaveAttribute('aria-hidden', 'true')

    // Before load: the text heading is the visible title (not hidden), logo not yet shown.
    const h2 = screen.getByRole('heading', { level: 2 })
    expect(h2).toHaveTextContent('Alpha')
    expect(h2).toHaveClass('ff-hero__title')
    expect(h2).not.toHaveClass('sr-only')
    expect(img).not.toHaveClass('is-ready')

    // After load: logo becomes visible, heading is visually hidden but still in the a11y tree.
    fireEvent.load(img)
    const h2After = screen.getByRole('heading', { level: 2 })
    expect(h2After).toHaveTextContent('Alpha')             // one accessible title, still present
    expect(h2After).toHaveClass('sr-only')
    expect(h2After).not.toHaveClass('ff-hero__title')
    expect(container.querySelector('.ff-hero__title-logo')).toHaveClass('is-ready')
  })

  it('renders the text title (no logo) when no titleLogoUrl is provided', () => {
    const { container } = renderHero()
    expect(container.querySelector('.ff-hero__title-logo')).not.toBeInTheDocument()
    const h2 = screen.getByRole('heading', { level: 2 })
    expect(h2).toHaveTextContent('Alpha')
    expect(h2).toHaveClass('ff-hero__title')
  })

  it('restores the text title when the logo fails to load (broken asset)', () => {
    const { container } = renderHero(withLogo())
    fireEvent.error(container.querySelector('.ff-hero__title-logo'))
    expect(container.querySelector('.ff-hero__title-logo')).not.toBeInTheDocument()
    const h2 = screen.getByRole('heading', { level: 2 })
    expect(h2).toHaveTextContent('Alpha')
    expect(h2).toHaveClass('ff-hero__title')
    expect(h2).not.toHaveClass('sr-only')
  })

  it('treats an empty / whitespace logo URL as no logo (text title)', () => {
    const { container } = renderHero(withLogo({ titleLogoUrl: '   ' }))
    expect(container.querySelector('.ff-hero__title-logo')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveClass('ff-hero__title')
  })

  it('keeps exactly one accessible title for the film (no duplicate exposure)', () => {
    const { container } = renderHero(withLogo())
    fireEvent.load(container.querySelector('.ff-hero__title-logo'))
    // The logo is aria-hidden; the only thing exposing the title is the single heading.
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
    expect(screen.getAllByText('Alpha')).toHaveLength(1)
  })
})

describe('HomeHero — actions preserve real behaviour', () => {
  it('Open Film File records a clicked outcome then navigates to /movie/:tmdbId', () => {
    renderHero()
    fireEvent.click(screen.getByRole('button', { name: 'Open Film File' }))
    expect(recordRecommendationOutcome).toHaveBeenCalledWith({ userId: 'u1', movieId: 1, action: 'clicked' })
    expect(navigate).toHaveBeenCalledWith('/movie/101')
  })

  it('Save toggles the watchlist write', () => {
    renderHero()
    fireEvent.click(screen.getByLabelText('Add Alpha to watchlist'))
    expect(toggleWatchlist).toHaveBeenCalledTimes(1)
  })

  it('Mark watched toggles the history write', () => {
    renderHero()
    fireEvent.click(screen.getByLabelText('Mark Alpha as already watched'))
    expect(toggleWatched).toHaveBeenCalledTimes(1)
  })

  it('Not tonight writes the skip signal + dismiss interaction and advances', () => {
    renderHero()
    fireEvent.click(screen.getByLabelText('Not tonight — skip Alpha'))
    expect(updateImpression).toHaveBeenCalledWith('u1', 1, 'skipped')
    expect(trackInteraction).toHaveBeenCalledWith('dismiss', expect.objectContaining({ movieId: 1, source: 'home_hero' }))
    // skipped film is hidden → next standout becomes active
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Beta')
  })
})
