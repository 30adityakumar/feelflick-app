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
  { id: 1, tmdb_id: 101, title: 'Alpha', release_year: 2020, runtime: 132, director_name: 'Dir A', backdrop_path: '/a.jpg', _reason: { type: 'director', text: 'More from Dir A' } },
  { id: 2, tmdb_id: 102, title: 'Beta', release_year: 2021, runtime: 95, director_name: 'Dir B', backdrop_path: '/b.jpg', _reason: { type: 'seed', text: 'Because you loved X' } },
  { id: 3, tmdb_id: 103, title: 'Gamma', release_year: 2019, runtime: 110, director_name: 'Dir C', backdrop_path: '/c.jpg', _reason: { type: 'mood', text: 'Matches your taste for tender films' } },
]
const USER = { id: 'u1' }
const renderHero = (films = FILMS) => render(<MemoryRouter><HomeHero films={films} user={USER} /></MemoryRouter>)

beforeEach(() => { vi.clearAllMocks(); movieStatus.isInWatchlist = false; movieStatus.isWatched = false; movieStatus.internalId = 1 })

describe('HomeHero — carousel navigation + active film', () => {
  it('renders the first standout with its grounded reason and meta', () => {
    renderHero()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Alpha')
    expect(screen.getByText('More from Dir A')).toBeInTheDocument()
    expect(screen.getByText('2020')).toBeInTheDocument()
    expect(screen.getByText('Dir A')).toBeInTheDocument()
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
