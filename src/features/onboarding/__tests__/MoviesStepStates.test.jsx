// src/features/onboarding/__tests__/MoviesStepStates.test.jsx
// F2.13 — MoviesStep rendered states (pool error/empty/loading, search input
// label, gated autofocus) + the leaf SearchDropdown / CardSkeletonRow a11y.
// The hooks are mocked so each state is controlled directly.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, within } from '@testing-library/react'

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
  setShowDropdown: vi.fn(), clearSearch: vi.fn(), searchError: false, retrySearch: vi.fn(),
  activeIndex: -1, setActiveIndex: vi.fn(), ...over,
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

describe('MoviesStep — editorial grid layout', () => {
  const film = (id, title) => ({ id, title, poster_path: `/${id}.jpg`, release_date: '2010-01-01' })

  it('renders suggestions as a wrapped grid, not a horizontal snap shelf', () => {
    useSuggestionPool.mockReturnValue(poolState({ pool: [film(1, 'Alpha'), film(2, 'Beta')] }))
    const { container } = render(<MoviesStep {...props()} />)
    expect(container.querySelector('.snap-x')).toBeNull()
    expect(container.querySelector('[class*="overflow-x-auto"]')).toBeNull()
    const grid = screen.getByRole('button', { name: /select alpha/i }).closest('div[class*="grid-cols-3"]')
    expect(grid).toBeTruthy()
  })

  it('labels the Suggestions zone with a real heading', () => {
    useSuggestionPool.mockReturnValue(poolState({ pool: [] }))
    render(<MoviesStep {...props()} />)
    expect(screen.getByRole('heading', { name: /suggestions/i })).toBeInTheDocument()
  })

  it('promotes selected films into a labelled "Your anchors" region', () => {
    render(<MoviesStep {...props({ favoriteMovies: [film(1, 'Alpha'), film(2, 'Beta')], isMovieSelected: id => [1, 2].includes(id) })} />)
    const region = screen.getByRole('region', { name: /your anchors/i })
    expect(region).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /your anchors/i })).toBeInTheDocument()
    expect(within(region).getByRole('button', { name: /remove alpha/i })).toBeInTheDocument()
    expect(within(region).getByRole('button', { name: /remove beta/i })).toBeInTheDocument()
  })

  it('hides the anchors zone when no films are selected', () => {
    render(<MoviesStep {...props({ favoriteMovies: [] })} />)
    expect(screen.queryByRole('region', { name: /your anchors/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /your anchors/i })).not.toBeInTheDocument()
  })

  it('renders 5 progress pips with Math.min(count, 5) filled', () => {
    render(<MoviesStep {...props({ favoriteMovies: [film(1, 'A'), film(2, 'B'), film(3, 'C')], isMovieSelected: () => true })} />)
    const pips = screen.getByTestId('anchor-pips')
    expect(pips.children).toHaveLength(5)
    expect([...pips.children].filter(s => s.className.includes('bg-[var(--color-brand-accent'))).toHaveLength(3)
  })

  it('caps filled pips at 5 when more than 5 anchors exist', () => {
    const films = Array.from({ length: 7 }, (_, i) => film(i + 1, `F${i + 1}`))
    render(<MoviesStep {...props({ favoriteMovies: films, isMovieSelected: () => true })} />)
    const pips = screen.getByTestId('anchor-pips')
    expect(pips.children).toHaveLength(5)
    expect([...pips.children].filter(s => s.className.includes('bg-[var(--color-brand-accent'))).toHaveLength(5)
  })
})

describe('MoviesStep — search input + autofocus', () => {
  it('gives the search input an accessible name', () => {
    render(<MoviesStep {...props()} />)
    expect(screen.getByRole('combobox', { name: /search for a film to add/i })).toBeInTheDocument()
  })

  it('does NOT autofocus the input under a coarse pointer', () => {
    vi.useFakeTimers()
    try {
      render(<MoviesStep {...props()} />)
      act(() => { vi.advanceTimersByTime(300) })
      expect(screen.getByRole('combobox', { name: /search for a film to add/i })).not.toHaveFocus()
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
      expect(screen.getByRole('combobox', { name: /search for a film to add/i })).toHaveFocus()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('MoviesStep — combobox semantics + keyboard', () => {
  const film = (id, title) => ({ id, title, poster_path: `/${id}.jpg`, release_date: '2010-01-01', popularity: id })
  const open = (over = {}) =>
    searchState({ query: 'inc', results: [film(11, 'A'), film(12, 'B'), film(13, 'C')], showDropdown: true, ...over })

  it('marks the input as a combobox controlling the listbox', () => {
    useMovieSearch.mockReturnValue(open({ activeIndex: -1 }))
    render(<MoviesStep {...props()} />)
    const input = screen.getByRole('combobox', { name: /search for a film to add/i })
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(input).toHaveAttribute('aria-controls', 'ob-search-listbox')
  })

  it('reflects the active option via aria-activedescendant', () => {
    useMovieSearch.mockReturnValue(open({ activeIndex: 1 }))
    render(<MoviesStep {...props()} />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-activedescendant', 'ob-search-listbox-opt-12')
  })

  it('renders the results as a listbox of options with the active one selected', () => {
    useMovieSearch.mockReturnValue(open({ activeIndex: 0 }))
    render(<MoviesStep {...props()} />)
    const listbox = screen.getByRole('listbox', { name: /search results/i })
    const options = within(listbox).getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')
    expect(options[0].id).toBe('ob-search-listbox-opt-11')
  })

  it('ArrowDown / ArrowUp move the active option (wrapping)', () => {
    const setActiveIndex = vi.fn()
    useMovieSearch.mockReturnValue(open({ activeIndex: -1, setActiveIndex }))
    render(<MoviesStep {...props()} />)
    const input = screen.getByRole('combobox')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    let updater = setActiveIndex.mock.calls.at(-1)[0]
    expect(updater(-1)).toBe(0) // none → first
    expect(updater(2)).toBe(0)  // last → wraps to first (n=3)
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    updater = setActiveIndex.mock.calls.at(-1)[0]
    expect(updater(-1)).toBe(2) // none → last
    expect(updater(0)).toBe(2)  // first → wraps to last
  })

  it('Home / End jump to first / last option', () => {
    const setActiveIndex = vi.fn()
    useMovieSearch.mockReturnValue(open({ activeIndex: 1, setActiveIndex }))
    render(<MoviesStep {...props()} />)
    const input = screen.getByRole('combobox')
    fireEvent.keyDown(input, { key: 'Home' })
    expect(setActiveIndex).toHaveBeenLastCalledWith(0)
    fireEvent.keyDown(input, { key: 'End' })
    expect(setActiveIndex).toHaveBeenLastCalledWith(2)
  })

  it('Enter selects the active option', () => {
    const addMovie = vi.fn()
    useMovieSearch.mockReturnValue(open({ activeIndex: 1 }))
    render(<MoviesStep {...props({ addMovie })} />)
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })
    expect(addMovie).toHaveBeenCalledWith(expect.objectContaining({ id: 12 }))
  })

  it('Escape closes the dropdown', () => {
    const setShowDropdown = vi.fn()
    useMovieSearch.mockReturnValue(open({ activeIndex: 0, setShowDropdown }))
    render(<MoviesStep {...props()} />)
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' })
    expect(setShowDropdown).toHaveBeenCalledWith(false)
  })

  it('arrow / enter with no options neither selects nor throws', () => {
    const addMovie = vi.fn()
    useMovieSearch.mockReturnValue(searchState({ query: 'zzz', results: [], showDropdown: true }))
    render(<MoviesStep {...props({ addMovie })} />)
    const input = screen.getByRole('combobox')
    expect(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      fireEvent.keyDown(input, { key: 'Enter' })
    }).not.toThrow()
    expect(addMovie).not.toHaveBeenCalled()
  })

  it('an outside pointerdown closes the dropdown', () => {
    const setShowDropdown = vi.fn()
    useMovieSearch.mockReturnValue(open({ activeIndex: 0, setShowDropdown }))
    render(<MoviesStep {...props()} />)
    fireEvent.pointerDown(document.body)
    expect(setShowDropdown).toHaveBeenCalledWith(false)
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
    render(<SearchDropdown searching={false} results={[film(1, 'Inception')]} isMovieSelected={() => true} onSelect={vi.fn()} searchError={false} activeIndex={-1} listboxId="ob-search-listbox" />)
    expect(screen.getByText('(already in your picks)')).toBeInTheDocument()
  })

  it('selecting a result by mouse click still calls onSelect', () => {
    const onSelect = vi.fn()
    render(<SearchDropdown searching={false} results={[film(1, 'A')]} isMovieSelected={() => false} onSelect={onSelect} searchError={false} activeIndex={-1} listboxId="ob-search-listbox" />)
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option'))
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
  })

  it('renders results as a listbox of options with stable ids + the active one selected', () => {
    render(<SearchDropdown searching={false} results={[film(1, 'A'), film(2, 'B')]} isMovieSelected={() => false} onSelect={vi.fn()} searchError={false} activeIndex={1} listboxId="ob-search-listbox" />)
    const listbox = screen.getByRole('listbox', { name: /search results/i })
    const options = within(listbox).getAllByRole('option')
    expect(options).toHaveLength(2)
    expect(options[0].id).toBe('ob-search-listbox-opt-1')
    expect(options[0]).toHaveAttribute('aria-selected', 'false')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
  })
})

describe('CardSkeletonRow — a11y', () => {
  it('exposes role=status + aria-busy + an sr-only label', () => {
    render(<CardSkeletonRow />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading suggestions')).toBeInTheDocument()
  })
})
