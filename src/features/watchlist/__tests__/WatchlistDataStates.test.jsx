import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const navigate = vi.fn()
// Keep the REAL router (useSearchParams drives mood/sort) but spy useNavigate.
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
  return {
    items: [], total: 0, availableMoods: [],
    loading: false, error: null,
    isRemoving: () => false,
    removeFromWatchlist: vi.fn(async () => ({ ok: true, action: 'removed', movieId: 1 })),
    refresh: vi.fn(),
    ...over,
  }
}

beforeEach(() => { navigate.mockClear() })
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('Watchlist load-error state — sanitized (F6.3 preserved)', () => {
  it('26/27/28. fixed safe copy (no raw backend text), one h1, role=alert', () => {
    mockCtx = ctx({ error: 'load_error' })
    const { container } = render(<Watchlist />, wrap)
    expect(screen.getByText('We couldn’t load your Watchlist.')).toBeInTheDocument()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelector('[role="alert"]')).toBeTruthy()
    expect(container.textContent).not.toMatch(/PGRST|rls|policy|relation|supabase|permission|undefined/i)
  })

  it('29/30. Try again calls refresh; Go to Home routes to /home', () => {
    const refresh = vi.fn()
    mockCtx = ctx({ error: 'load_error', refresh })
    render(<Watchlist />, wrap)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refresh).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Go to Home' }))
    expect(navigate).toHaveBeenCalledWith('/home')
  })
})

describe('Watchlist live region + announcements (F6.3 preserved)', () => {
  it('42/37. exactly one polite/atomic region, empty initially', () => {
    mockCtx = ctx({ items: [item()], total: 1 })
    const { container } = render(<Watchlist />, wrap)
    const regions = container.querySelectorAll('[role="status"][aria-live="polite"][aria-atomic="true"]')
    expect(regions).toHaveLength(1)
    expect(regions[0].textContent).toBe('')
  })

  it('38. individual success announces after settlement', async () => {
    mockCtx = ctx({ items: [item({ title: 'A' }), item({ id: 2, title: 'B' })], total: 2 })
    render(<Watchlist />, wrap)
    fireEvent.click(screen.getByRole('button', { name: 'Remove A from Watchlist' }))
    await waitFor(() => expect(screen.getByText('Removed A from your Watchlist.')).toBeInTheDocument())
  })

  it('39. individual failure announces failure', async () => {
    mockCtx = ctx({ items: [item({ title: 'A' })], total: 1, removeFromWatchlist: vi.fn(async () => ({ ok: false, action: 'remove_failed', movieId: 1 })) })
    render(<Watchlist />, wrap)
    fireEvent.click(screen.getByRole('button', { name: 'Remove A from Watchlist' }))
    await waitFor(() => expect(screen.getByText('Could not remove A. Try again.')).toBeInTheDocument())
  })
})

describe('Watchlist remove control pending state (F6.3 preserved)', () => {
  it('43/54/55. aria-busy + disabled + "Removing {title}" while pending', () => {
    mockCtx = ctx({ items: [item({ title: 'A' })], total: 1, isRemoving: (id) => id === 1 })
    render(<Watchlist />, wrap)
    const btn = screen.getByRole('button', { name: 'Removing A' })
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(btn).toBeDisabled()
  })
})
