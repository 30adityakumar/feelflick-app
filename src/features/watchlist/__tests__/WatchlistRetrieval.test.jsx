import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Retrieval (search + URL mood/sort) + card truth for the redesigned Watchlist. Real router
// (useSearchParams drives mood/sort); useWatchlistData mocked to a ready collection.

const navigate = vi.fn()
vi.mock('react-router-dom', async (orig) => ({ ...await orig(), useNavigate: () => navigate }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))

let mockCtx
vi.mock('../useWatchlistData', () => ({ WatchlistDataProvider: ({ children }) => children, useWatchlistData: () => mockCtx }))
import Watchlist from '../Watchlist'

const item = (over = {}) => ({ id: 1, internalId: 11, tmdbId: 101, title: 'A', year: 2020, runtime: 100, dir: 'D', mood: 'Tender', hex: '#aaa', addedAt: '2026-03-09T00:00:00Z', addedDaysAgo: 1, savedDate: 'Mar 9', savedLabel: 'Saved yesterday', poster: null, ...over })

const ITEMS = [
  item({ id: 1, tmdbId: 101, title: 'Harbor', dir: 'Vance', mood: 'Tender', runtime: 120, poster: 'http://x/a.jpg' }),
  item({ id: 2, tmdbId: 102, title: 'Lantern', dir: 'Park', mood: 'Tense', runtime: 90, poster: 'http://x/b.jpg' }),
  item({ id: 3, tmdbId: null, title: 'Noidfilm', dir: 'Mori', mood: 'Tender', runtime: 0, poster: null }),
]
function ctx(over = {}) {
  return {
    items: ITEMS, total: ITEMS.length,
    availableMoods: [{ mood: 'Tender', count: 2 }, { mood: 'Tense', count: 1 }],
    loading: false, error: null, isRemoving: () => false,
    removeFromWatchlist: vi.fn(async () => ({ ok: true, movieId: 1 })), refresh: vi.fn(), ...over,
  }
}
const atUrl = (url) => ({ wrapper: ({ children }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter> })
const titlesOf = () => screen.getAllByRole('listitem').map((li) => within(li).getByRole('heading').textContent)

beforeEach(() => { mockCtx = ctx(); navigate.mockClear() })
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('Watchlist search', () => {
  it('filters by title and by director; clear restores all', () => {
    render(<Watchlist />, atUrl('/watchlist'))
    const input = screen.getByLabelText('Search Watchlist')
    fireEvent.change(input, { target: { value: 'lantern' } })
    expect(titlesOf()).toEqual(['Lantern'])
    fireEvent.change(input, { target: { value: 'park' } }) // director match
    expect(titlesOf()).toEqual(['Lantern'])
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('Escape clears the search', () => {
    render(<Watchlist />, atUrl('/watchlist'))
    const input = screen.getByLabelText('Search Watchlist')
    fireEvent.change(input, { target: { value: 'lantern' } })
    expect(titlesOf()).toEqual(['Lantern'])
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('no-match search shows the search-only filtered-empty copy', () => {
    render(<Watchlist />, atUrl('/watchlist'))
    fireEvent.change(screen.getByLabelText('Search Watchlist'), { target: { value: 'zzzzz' } })
    expect(screen.getByText('No saved films match your search.')).toBeInTheDocument()
  })
})

describe('Watchlist URL mood/sort', () => {
  it('?mood=Tense shows only Tense films and marks the pill active', () => {
    render(<Watchlist />, atUrl('/watchlist?mood=Tense'))
    expect(titlesOf()).toEqual(['Lantern'])
    expect(screen.getByRole('button', { name: 'Tense' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('?sort=oldest orders by added_at ascending and reflects in the control', () => {
    mockCtx = ctx({
      items: [item({ id: 1, title: 'New', addedAt: '2026-03-09T00:00:00Z' }), item({ id: 2, title: 'Old', addedAt: '2026-01-01T00:00:00Z' })],
      total: 2, availableMoods: [{ mood: 'Tender', count: 2 }],
    })
    render(<Watchlist />, atUrl('/watchlist?sort=oldest'))
    expect(screen.getByRole('combobox', { name: 'Sort saved films' })).toHaveValue('oldest')
    expect(titlesOf()).toEqual(['Old', 'New'])
  })

  it('invalid ?sort= and ?mood= fall back safely (recent / all)', () => {
    render(<Watchlist />, atUrl('/watchlist?sort=bogus&mood=Nope'))
    expect(screen.getByRole('combobox', { name: 'Sort saved films' })).toHaveValue('recent')
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('listitem')).toHaveLength(3) // no mood filter applied
  })

  it('Show all clears mood but preserves the active sort', () => {
    render(<Watchlist />, atUrl('/watchlist?sort=oldest&mood=Tense'))
    fireEvent.change(screen.getByLabelText('Search Watchlist'), { target: { value: 'zzzzz' } }) // force empty (search+mood)
    fireEvent.click(screen.getByRole('button', { name: 'Show all' }))
    expect(screen.getByRole('combobox', { name: 'Sort saved films' })).toHaveValue('oldest') // sort preserved
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true') // mood cleared
  })
})

describe('Watchlist card truth', () => {
  it('a row without a TMDB id is non-interactive (no broken link)', () => {
    render(<Watchlist />, atUrl('/watchlist'))
    const noId = screen.getByRole('heading', { name: 'Noidfilm' }).closest('[role="listitem"]')
    expect(within(noId).queryAllByRole('link')).toHaveLength(0) // no Film File link
    expect(noId.querySelector('.ff-wl-card__noart')).toHaveTextContent('Noidfilm') // missing-poster fallback shows the title
  })

  it('rows with a TMDB id route to /movie/:tmdbId; lazy posters', () => {
    render(<Watchlist />, atUrl('/watchlist'))
    expect(screen.getByRole('link', { name: 'Harbor' })).toHaveAttribute('href', '/movie/101')
    const img = screen.getByRole('link', { name: 'Harbor' }).querySelector('img')
    expect(img).toHaveAttribute('loading', 'lazy')
  })
})
