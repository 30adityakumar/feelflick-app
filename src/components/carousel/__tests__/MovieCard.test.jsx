import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { MovieCard } from '../CardContent/MovieCard'
import { updateImpression } from '@/shared/services/recommendations'

const mockNavigate = vi.fn()
const mockCardEnter = vi.fn()
const mockCardLeave = vi.fn()
const mockCardFocus = vi.fn()
const mockCardBlur = vi.fn()
const mockToggleWatchlist = vi.fn()
const mockToggleWatched = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('@/shared/api/tmdb', () => ({
  tmdbImg: (path, size) => `https://image.tmdb.org/t/p/${size}${path}`,
  posterSrcSet: (path, sizes) => sizes.map(s => `https://image.tmdb.org/t/p/${s}${path} ${s.replace('w','')}w`).join(', '),
}))

vi.mock('@/app/providers/WatchlistContext', () => ({
  useWatchlistContext: () => ({
    user: { id: 'user-1' },
    ready: true,
  }),
}))

vi.mock('@/shared/hooks/useUserMovieStatus', () => ({
  useUserMovieStatus: () => ({
    isInWatchlist: false,
    isWatched: false,
    loading: { watchlist: false, watched: false },
    toggleWatchlist: mockToggleWatchlist,
    toggleWatched: mockToggleWatched,
  }),
}))

vi.mock('@/shared/services/recommendations', () => ({
  updateImpression: vi.fn(() => Promise.resolve()),
}))

const movie = {
  id: 101,
  tmdb_id: 999,
  title: 'Furiosa',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  release_date: '2024-05-24',
  vote_average: 7.5,
  runtime: 149,
  overview: 'A road war erupts in the wasteland.',
  tagline: 'A revenge saga forged in chrome.',
  genres: [{ id: 1, name: 'Action' }, { id: 2, name: 'Adventure' }],
  _pickReason: { label: 'Because you loved Mad Max' },
}

describe('Homepage carousel cards', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockCardEnter.mockReset()
    mockCardLeave.mockReset()
    mockCardFocus.mockReset()
    mockCardBlur.mockReset()
    mockToggleWatchlist.mockReset()
    mockToggleWatched.mockReset()
    vi.mocked(updateImpression).mockClear()
  })

  it('navigates on click', () => {
    render(<MovieCard item={movie} width={220} height={330} />)

    fireEvent.click(screen.getByRole('button', { name: /open furiosa/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/movie/999')
  })

  // F8B: a click on a recommendation-row card records the 'clicked' OUTCOME.
  // Regression guard for the bug where `placement` was passed as the action arg
  // (matching no branch in updateImpression), so clicks were never captured.
  it('records the clicked outcome with action "clicked" when placement is set', () => {
    render(<MovieCard item={movie} placement="because_you_loved" width={220} height={330} />)

    fireEvent.click(screen.getByRole('button', { name: /open furiosa/i }))

    expect(updateImpression).toHaveBeenCalledWith('user-1', 101, 'clicked')
  })

  it('does NOT record an impression outcome for a non-recommendation card (no placement)', () => {
    render(<MovieCard item={movie} width={220} height={330} />)

    fireEvent.click(screen.getByRole('button', { name: /open furiosa/i }))

    expect(updateImpression).not.toHaveBeenCalled()
  })

  it('forwards hover and focus state through the row hover controller API', () => {
    render(
      <MovieCard
        item={movie}
        width={220}
        height={330}
        onCardEnter={mockCardEnter}
        onCardLeave={mockCardLeave}
        onCardFocus={mockCardFocus}
        onCardBlur={mockCardBlur}
      />
    )

    const trigger = screen.getByRole('button', { name: /open furiosa/i })

    fireEvent.mouseEnter(trigger)
    fireEvent.mouseLeave(trigger)
    fireEvent.focus(trigger)
    fireEvent.blur(trigger)

    expect(mockCardEnter).toHaveBeenCalledWith(movie, trigger)
    expect(mockCardLeave).toHaveBeenCalled()
    expect(mockCardFocus).toHaveBeenCalledWith(movie, trigger)
    expect(mockCardBlur).toHaveBeenCalled()
  })

  it('renders watchlist and watched action buttons for logged-in users', () => {
    render(<MovieCard item={movie} width={220} height={330} hovered={true} />)

    expect(screen.getByRole('button', { name: /add to watchlist/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mark watched/i })).toBeInTheDocument()
  })

  it('watchlist and watched actions fire without triggering navigation', () => {
    render(<MovieCard item={movie} width={220} height={330} hovered={true} />)

    fireEvent.click(screen.getByRole('button', { name: /add to watchlist/i }))
    fireEvent.click(screen.getByRole('button', { name: /mark watched/i }))

    expect(mockToggleWatchlist).toHaveBeenCalledTimes(1)
    expect(mockToggleWatched).toHaveBeenCalledTimes(1)
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
