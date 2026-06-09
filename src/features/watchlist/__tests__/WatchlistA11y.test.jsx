import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'

const navigate = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate, Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))

let mockCtx
vi.mock('../useWatchlistData', () => ({ WatchlistDataProvider: ({ children }) => children, useWatchlistData: () => mockCtx }))
import Watchlist from '../Watchlist'

const item = (over = {}) => ({ id: 1, internalId: 11, tmdbId: 101, title: 'A', year: 2020, runtime: 100, dir: 'D', mood: 'Tender', hex: '#A78BFA', addedAt: '2026-03-09T00:00:00Z', addedDaysAgo: 1, savedDate: 'Mar 9', savedLabel: 'Saved yesterday', poster: null, ...over })
function ctx(over = {}) {
  return { items: [], total: 0, availableMoods: [], loading: false, error: null, isRemoving: () => false, removeFromWatchlist: vi.fn(async () => ({ ok: true, movieId: 1 })), refresh: vi.fn(), ...over }
}
const withItems = (n, over = {}) => ctx({ items: Array.from({ length: n }, (_, i) => item({ id: i + 1, tmdbId: 100 + i, title: `Film ${i + 1}` })), total: n, availableMoods: [{ mood: 'Tender', count: n }], ...over })

beforeEach(() => navigate.mockClear())
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('Watchlist — a11y/responsive hardening (F6.7)', () => {
  it('each saved-film item is exactly ONE Film File link + ONE Remove action', () => {
    mockCtx = withItems(1)
    render(<Watchlist />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(1)
    const card = items[0]
    expect(within(card).getAllByRole('link')).toHaveLength(1)
    expect(within(card).getByRole('link')).toHaveAttribute('href', '/movie/100')
    expect(within(card).getAllByRole('button')).toHaveLength(1) // only Remove
    expect(within(card).getByRole('button', { name: /Remove Film 1 from Watchlist/i })).toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: 'Open' })).toBeNull()
  })

  it('the collection is a labelled list whose listitem count matches the films', () => {
    mockCtx = withItems(3)
    render(<Watchlist />)
    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
  })

  it('the Remove control is ≥44px and exposes pending state', () => {
    mockCtx = withItems(1, { isRemoving: (id) => id === 1 })
    render(<Watchlist />)
    const btn = screen.getByRole('button', { name: 'Removing Film 1' })
    expect(btn.style.minHeight).toBe('44px')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })

  it('loading shows an honest busy status with a visually-hidden message', () => {
    mockCtx = ctx({ loading: true })
    render(<Watchlist />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading your watchlist…')).toBeInTheDocument()
  })

  it('filtered-empty is announced via role="status"', () => {
    // availableMoods offers a mood no item has → selecting it yields filtered-empty.
    mockCtx = ctx({ items: [item({ mood: 'Tender' })], total: 1, availableMoods: [{ mood: 'Tense', count: 0 }] })
    render(<Watchlist />)
    fireEvent.click(screen.getByRole('button', { name: 'Tense' }))
    // (the page also has the persistent announcement live region — scope to the one with copy)
    const statuses = screen.getAllByRole('status')
    expect(statuses.some(s => /No saved films match this mood\./.test(s.textContent))).toBe(true)
  })
})
