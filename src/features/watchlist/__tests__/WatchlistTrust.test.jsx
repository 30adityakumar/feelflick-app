import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const navigate = vi.fn()
vi.mock('react-router-dom', async (orig) => ({ ...await orig(), useNavigate: () => navigate }))
const wrap = { wrapper: MemoryRouter }
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))

let mockCtx
vi.mock('../useWatchlistData', () => ({
  WatchlistDataProvider: ({ children }) => children,
  useWatchlistData: () => mockCtx,
}))

import Watchlist from '../Watchlist'

const item = (over = {}) => ({ id: 1, internalId: 11, tmdbId: 101, title: 'A', year: 2020, runtime: 100, dir: 'D', mood: 'Tender', hex: '#A78BFA', addedAt: '2026-03-09T00:00:00Z', addedDaysAgo: 1, savedDate: 'Mar 9', savedLabel: 'Saved yesterday', poster: null, ...over })
function ctx(over = {}) {
  return { items: [], total: 0, availableMoods: [], loading: false, error: null, isRemoving: () => false, removeFromWatchlist: vi.fn(async () => ({ ok: true, movieId: 1 })), refresh: vi.fn(), ...over }
}
const withItems = (n = 2, over = {}) => {
  const items = Array.from({ length: n }, (_, i) => item({ id: i + 1, tmdbId: 100 + i, title: `Film ${i + 1}` }))
  return ctx({ items, total: n, availableMoods: [{ mood: 'Tender', count: n }], ...over })
}

beforeEach(() => navigate.mockClear())
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('Watchlist — calm saved-intent role (F6.4)', () => {
  it('20/40. masthead says Watchlist + "Saved for later."; exactly one h1', () => {
    mockCtx = withItems()
    const { container } = render(<Watchlist />, wrap)
    expect(screen.getByRole('heading', { level: 1, name: /Saved for later\./i })).toBeInTheDocument()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(screen.getByText(/Films you saved for another moment/i)).toBeInTheDocument()
  })

  it('21/22/23/24/31. no queue / stale / "Perfect for tonight" / "Top match" / bulk-guilt framing', () => {
    mockCtx = withItems()
    const { container } = render(<Watchlist />, wrap)
    const t = container.textContent
    expect(t).not.toMatch(/\bqueue\b/i)
    expect(t).not.toMatch(/stale|getting stale|longest waiting|waiting \d+d/i)
    expect(t).not.toMatch(/perfect for tonight|perfect tonight|tonight/i)
    expect(t).not.toMatch(/top match|match %|clear all|queue hygiene|cut what you/i)
  })

  it('25. no integer match percentage anywhere (text or accessible names)', () => {
    mockCtx = withItems()
    const { container } = render(<Watchlist />, wrap)
    expect(container.textContent).not.toMatch(/\d+%/)
    for (const b of screen.getAllByRole('button')) {
      expect(b.getAttribute('aria-label') || '').not.toMatch(/\d+%|match/i)
    }
  })

  it('26/27. sort options are saved-date based (default Recently saved); no Match % / Longest waiting', () => {
    mockCtx = withItems()
    render(<Watchlist />, wrap)
    const select = screen.getByRole('combobox', { name: 'Sort saved films' })
    expect(select).toHaveValue('recent')
    const opts = within(select).getAllByRole('option').map(o => o.textContent)
    expect(opts).toEqual(['Recently saved', 'Oldest saved', 'Runtime', 'Title'])
    expect(opts.join(' ')).not.toMatch(/Match|Longest waiting/i)
  })

  it('28/29/30/41. one saved-film collection — no featured tier, no pulse dashboard, no duplicate film', () => {
    mockCtx = withItems(2)
    const { container } = render(<Watchlist />, wrap)
    expect(container.querySelectorAll('.ff-wl-grid')).toHaveLength(1)
    // each film title appears exactly once (heading) → no featured-vs-list duplication
    expect(screen.getAllByRole('heading', { name: 'Film 1' })).toHaveLength(1)
    // no stat dashboard labels
    expect(container.textContent).not.toMatch(/Perfect for tonight|Getting stale|Total queue|Avg/i)
  })

  it('32/33. the mood filter is labelled "Filter by film mood" with only All + present moods', () => {
    mockCtx = withItems()
    render(<Watchlist />, wrap)
    const group = screen.getByRole('group', { name: 'Filter by film mood' })
    const labels = within(group).getAllByRole('button').map(b => b.textContent)
    expect(labels).toEqual(['All', 'Tender'])
    expect(labels.join(' ')).not.toMatch(/Perfect|Stale/i)
  })

  it('34. cards show neutral saved-age language', () => {
    mockCtx = withItems(1)
    render(<Watchlist />, wrap)
    expect(screen.getByText('Saved yesterday')).toBeInTheDocument()
  })

  it('35. one Film File link per item routes to /movie/:tmdbId (unchanged)', () => {
    mockCtx = withItems(1)
    render(<Watchlist />, wrap)
    // F6.7: a single Film File link (named by the title) — no duplicate "Open" button.
    expect(screen.getByRole('link', { name: 'Film 1' })).toHaveAttribute('href', '/movie/100')
    expect(screen.queryByRole('button', { name: 'Open' })).toBeNull()
  })
})

describe('Watchlist empty + filtered-empty states (F6.4)', () => {
  it('37/38. empty state routes to Discover + Browse (not only Home)', () => {
    mockCtx = ctx({ items: [], total: 0 })
    render(<Watchlist />, wrap)
    expect(screen.getByText('Your Watchlist is open.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Open Discover/i }))
    expect(navigate).toHaveBeenCalledWith('/discover')
    fireEvent.click(screen.getByRole('button', { name: /Browse films/i }))
    expect(navigate).toHaveBeenCalledWith('/browse')
  })

  it('39. filtered-empty shows a Show-all reset that restores the collection', () => {
    // availableMoods offers a mood no item actually has → choosing it yields filtered-empty.
    mockCtx = ctx({ items: [item({ mood: 'Tender' })], total: 1, availableMoods: [{ mood: 'Tense', count: 0 }] })
    render(<Watchlist />, wrap)
    fireEvent.click(screen.getByRole('button', { name: 'Tense' }))
    expect(screen.getByText('No saved films match this mood.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show all' }))
    expect(screen.getByRole('heading', { name: 'A' })).toBeInTheDocument() // collection restored
  })
})

describe('Watchlist — shared Library identity + cross-navigation (F6.6)', () => {
  it('13/14/17. eyebrow is "Your library", h1 stays "Saved for later.", exactly one h1', () => {
    mockCtx = withItems(1)
    const { container } = render(<Watchlist />, wrap)
    expect(screen.getByText('Your library')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /Saved for later\./i })).toBeInTheDocument()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
  })

  it('15/16. the Library nav marks Watchlist active and links Diary → /history', () => {
    mockCtx = withItems(1)
    render(<Watchlist />, wrap)
    const nav = screen.getByRole('navigation', { name: 'Library sections' })
    expect(within(nav).getByRole('link', { name: 'Watchlist' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Diary' })).toHaveAttribute('href', '/history')
  })

  it('18/19. the saved count and the sort control remain', () => {
    mockCtx = withItems(2)
    render(<Watchlist />, wrap)
    expect(screen.getByText(/2 films saved/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Sort saved films' })).toBeInTheDocument()
  })

  it('20/21. the section nav is present in the empty AND the load-error states (one h1 each)', () => {
    mockCtx = ctx({ items: [], total: 0 })
    const { rerender } = render(<Watchlist />, wrap)
    expect(screen.getByRole('navigation', { name: 'Library sections' })).toBeInTheDocument()
    mockCtx = ctx({ error: 'load_error' })
    rerender(<Watchlist />, wrap)
    expect(screen.getByRole('navigation', { name: 'Library sections' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(document.querySelectorAll('h1')).toHaveLength(1) // PageError's, not a competing masthead h1
  })
})
