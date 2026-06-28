import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const navigate = vi.fn()
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }))

vi.mock('@/app/providers/WatchlistContext', () => ({ useWatchlistContext: () => ({ user: { id: 'u1' }, ready: true }) }))

const toggleWatchlist = vi.fn()
const toggleWatched = vi.fn()
const status = { isInWatchlist: false, isWatched: false, loading: { watchlist: false, watched: false }, toggleWatchlist, toggleWatched }
vi.mock('@/shared/hooks/useUserMovieStatus', () => ({ useUserMovieStatus: () => status }))

const updateImpression = vi.fn(() => Promise.resolve())
vi.mock('@/shared/services/recommendations', () => ({ updateImpression: (...a) => updateImpression(...a) }))
const track = vi.fn()
vi.mock('@/shared/services/analytics', () => ({ track: (...a) => track(...a) }))
vi.mock('../atoms', () => ({ SmartImg: ({ film }) => <img alt={film?.title || ''} /> }))

import HomeMovieCard from '../components/HomeMovieCard'

const FILM = { id: 7, tmdb_id: 700, title: 'Reason Film', release_year: 2022, director_name: 'Some Dir' }
const renderCard = (film = FILM) => render(<MemoryRouter><HomeMovieCard film={film} index={0} rowTitle="Your taste, distilled" /></MemoryRouter>)

beforeEach(() => { vi.clearAllMocks(); status.isInWatchlist = false; status.isWatched = false })

describe('HomeMovieCard', () => {
  it('renders title and meta (year · director)', () => {
    renderCard()
    expect(screen.getByText('Reason Film')).toBeInTheDocument()
    expect(screen.getByText('2022 · Some Dir')).toBeInTheDocument()
  })

  it('opening the card records a clicked outcome, tracks the click, and navigates', () => {
    renderCard()
    fireEvent.click(screen.getByLabelText('Open Film File for Reason Film'))
    expect(updateImpression).toHaveBeenCalledWith('u1', 7, 'clicked')
    expect(track).toHaveBeenCalledWith('card_clicked', expect.objectContaining({ movie_id: 700, row_title: 'Your taste, distilled' }))
    expect(navigate).toHaveBeenCalledWith('/movie/700')
  })

  it('Save tracks + toggles the watchlist (and does not navigate)', () => {
    renderCard()
    fireEvent.click(screen.getByLabelText('Add Reason Film to watchlist'))
    expect(track).toHaveBeenCalledWith('card_watchlisted', expect.objectContaining({ movie_id: 700 }))
    expect(toggleWatchlist).toHaveBeenCalledTimes(1)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('Watched toggles the history write (and does not navigate)', () => {
    renderCard()
    fireEvent.click(screen.getByLabelText('Mark Reason Film as watched'))
    expect(toggleWatched).toHaveBeenCalledTimes(1)
    expect(navigate).not.toHaveBeenCalled()
  })
})
