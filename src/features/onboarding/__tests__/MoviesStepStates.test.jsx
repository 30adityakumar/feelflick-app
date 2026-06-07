// src/features/onboarding/__tests__/MoviesStepStates.test.jsx
// F2.13 — MoviesStep rendered states (pool error/empty/loading, search input
// label, gated autofocus) + the leaf SearchDropdown / CardSkeletonRow a11y.
// The hooks are mocked so each state is controlled directly.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

vi.mock('@/shared/api/tmdb', () => ({ tmdbImg: p => `x${p}`, searchMovies: vi.fn() }))
vi.mock('../hooks/useSuggestionPool', () => ({ useSuggestionPool: vi.fn() }))
vi.mock('../hooks/useMovieSearch', () => ({ useMovieSearch: vi.fn() }))

import { useSuggestionPool } from '../hooks/useSuggestionPool'
import { useMovieSearch } from '../hooks/useMovieSearch'
import MoviesStep from '../steps/MoviesStep'
import SearchDropdown from '../steps/movies/SearchDropdown'
import CardSkeletonRow from '../steps/movies/CardSkeletonRow'

const poolState = (over = {}) => ({ pool: [], poolLoading: false, poolError: false, retry: vi.fn(), ...over })
const searchState = (over = {}) => ({
  query: '', setQuery: vi.fn(), results: [], searching: false, showDropdown: false,
  setShowDropdown: vi.fn(), clearSearch: vi.fn(), searchError: false, retrySearch: vi.fn(), ...over,
})
const props = (over = {}) => ({
  selectedGenreIds: [], moods: [], favoriteMovies: [], addMovie: vi.fn(), removeMovie: vi.fn(),
  isMovieSelected: () => false, onBack: vi.fn(), onFinish: vi.fn(), loading: false, error: '', ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  // default: coarse pointer (no autofocus) for everything except the explicit fine test
  window.matchMedia = vi.fn().mockImplementation(q => ({
    matches: false, media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
  useSuggestionPool.mockReturnValue(poolState())
  useMovieSearch.mockReturnValue(searchState())
})

describe('MoviesStep — pool states', () => {
  it('shows a role=alert pool-error card + retry button (before the empty state)', () => {
    const retry = vi.fn()
    useSuggestionPool.mockReturnValue(poolState({ poolError: true, retry }))
    render(<MoviesStep {...props()} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /retry loading suggestions/i }))
    expect(retry).toHaveBeenCalled()
    expect(screen.queryByText(/all suggestions added/i)).not.toBeInTheDocument()
  })

  it('shows "All suggestions added" only on a TRUE empty (no error, not loading)', () => {
    useSuggestionPool.mockReturnValue(poolState({ pool: [], poolLoading: false, poolError: false }))
    render(<MoviesStep {...props()} />)
    expect(screen.getByText(/all suggestions added/i)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the loading skeleton (role=status, aria-busy) while the pool loads', () => {
    useSuggestionPool.mockReturnValue(poolState({ poolLoading: true }))
    render(<MoviesStep {...props()} />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  })
})

describe('MoviesStep — search input + autofocus', () => {
  it('gives the search input an accessible name', () => {
    render(<MoviesStep {...props()} />)
    expect(screen.getByRole('textbox', { name: /search for a film to add/i })).toBeInTheDocument()
  })

  it('does NOT autofocus the input under a coarse pointer', () => {
    vi.useFakeTimers()
    try {
      render(<MoviesStep {...props()} />)
      act(() => { vi.advanceTimersByTime(300) })
      expect(screen.getByRole('textbox', { name: /search for a film to add/i })).not.toHaveFocus()
    } finally {
      vi.useRealTimers()
    }
  })

  it('DOES autofocus the input under a fine pointer', () => {
    vi.useFakeTimers()
    try {
      window.matchMedia = vi.fn().mockImplementation(q => ({
        matches: q.includes('fine'), media: q, onchange: null,
        addEventListener: vi.fn(), removeEventListener: vi.fn(),
        addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
      }))
      render(<MoviesStep {...props()} />)
      act(() => { vi.advanceTimersByTime(150) })
      expect(screen.getByRole('textbox', { name: /search for a film to add/i })).toHaveFocus()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('SearchDropdown — error / status / selected states', () => {
  const film = (id, title) => ({ id, title, poster_path: `/${id}.jpg`, release_date: '2010-01-01', popularity: 5 })

  it('renders a role=alert retry row on searchError, never "No results"', () => {
    const onRetry = vi.fn()
    render(<SearchDropdown searching={false} results={[]} isMovieSelected={() => false} onSelect={vi.fn()} searchError={true} onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText(/no results/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /retry search/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('announces the searching state (role=status, aria-live)', () => {
    render(<SearchDropdown searching={true} results={[]} isMovieSelected={() => false} onSelect={vi.fn()} searchError={false} />)
    const el = screen.getByText('Searching…')
    expect(el).toHaveAttribute('role', 'status')
    expect(el).toHaveAttribute('aria-live', 'polite')
  })

  it('announces a TRUE no-results (role=status), not an alert', () => {
    render(<SearchDropdown searching={false} results={[]} isMovieSelected={() => false} onSelect={vi.fn()} searchError={false} />)
    const el = screen.getByText(/no results — try a different title/i)
    expect(el).toHaveAttribute('role', 'status')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('marks an already-selected result with sr-only text', () => {
    render(<SearchDropdown searching={false} results={[film(1, 'Inception')]} isMovieSelected={() => true} onSelect={vi.fn()} searchError={false} />)
    expect(screen.getByText('(already in your picks)')).toBeInTheDocument()
  })
})

describe('CardSkeletonRow — a11y', () => {
  it('exposes role=status + aria-busy + an sr-only label', () => {
    render(<CardSkeletonRow />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading suggestions')).toBeInTheDocument()
  })
})
