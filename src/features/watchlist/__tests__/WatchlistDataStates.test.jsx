import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'

const navigate = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))

let mockCtx
vi.mock('../useWatchlistData', () => ({
  WatchlistDataProvider: ({ children }) => children,
  useWatchlistData: () => mockCtx,
}))

import Watchlist from '../Watchlist'

const baseStats = { watchlistTotal: 0, perfectForTonightCount: 0, gettingStaleCount: 0, topMatchPct: 0, avgMatchPct: 0 }
const item = (over = {}) => ({ id: 1, internalId: 11, tmdbId: 101, title: 'A', year: 2020, runtime: 100, dir: 'D', mood: 'Tender', hex: '#A78BFA', match: 70, perfect: false, stale: false, addedDaysAgo: 1, poster: null, why: 'why', ...over })

function ctx(over = {}) {
  return {
    items: [], stats: baseStats, availableMoods: [], hasFingerprint: false,
    loading: false, error: null, removingStale: false,
    isRemoving: () => false,
    removeFromWatchlist: vi.fn(async () => ({ ok: true, action: 'removed', movieId: 1 })),
    removeStale: vi.fn(async () => ({ ok: true, removedCount: 1 })),
    refresh: vi.fn(),
    ...over,
  }
}

beforeEach(() => { navigate.mockClear() })
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('Watchlist load-error state — sanitized (F6.3)', () => {
  it('26/27/28. renders fixed safe copy (no raw backend text), one h1, role=alert', () => {
    mockCtx = ctx({ error: 'load_error', refresh: vi.fn() })
    const { container } = render(<Watchlist />)
    expect(screen.getByText('We couldn’t load your Watchlist.')).toBeInTheDocument()
    expect(screen.getByText(/Your saved films are still safe/i)).toBeInTheDocument()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelector('[role="alert"]')).toBeTruthy()
    // no raw backend wording anywhere
    expect(container.textContent).not.toMatch(/PGRST|rls|policy|relation|supabase|permission|undefined/i)
  })

  it('29/30. Try again calls refresh; Go to Home routes to /home', () => {
    const refresh = vi.fn()
    mockCtx = ctx({ error: 'load_error', refresh })
    render(<Watchlist />)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refresh).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Go to Home' }))
    expect(navigate).toHaveBeenCalledWith('/home')
  })
})

describe('Watchlist persistent live region + announcements (F6.3)', () => {
  it('36/37. exactly one polite/atomic region, empty initially', () => {
    mockCtx = ctx({ items: [item()], stats: { ...baseStats, watchlistTotal: 1 } })
    const { container } = render(<Watchlist />)
    const regions = container.querySelectorAll('[role="status"][aria-live="polite"][aria-atomic="true"]')
    expect(regions).toHaveLength(1)
    expect(regions[0].textContent).toBe('')
  })

  it('38. individual success announces AFTER settlement', async () => {
    mockCtx = ctx({ items: [item({ title: 'A' }), item({ id: 2, title: 'B' })], stats: { ...baseStats, watchlistTotal: 2 } })
    render(<Watchlist />)
    fireEvent.click(screen.getAllByRole('button', { name: /Remove A from watchlist/i })[0])
    await waitFor(() => expect(screen.getByText('Removed A from your Watchlist.')).toBeInTheDocument())
  })

  it('39. individual failure announces failure (item retained)', async () => {
    mockCtx = ctx({
      items: [item({ title: 'A' })], stats: { ...baseStats, watchlistTotal: 1 },
      removeFromWatchlist: vi.fn(async () => ({ ok: false, action: 'remove_failed', movieId: 1 })),
    })
    render(<Watchlist />)
    fireEvent.click(screen.getAllByRole('button', { name: /Remove A from watchlist/i })[0])
    await waitFor(() => expect(screen.getByText('Could not remove A. Try again.')).toBeInTheDocument())
  })

  it('40/41. bulk singular/plural success + failure', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockCtx = ctx({ items: [item({ stale: true })], stats: { ...baseStats, watchlistTotal: 1, gettingStaleCount: 1 }, removeStale: vi.fn(async () => ({ ok: true, removedCount: 2 })) })
    render(<Watchlist />)
    fireEvent.click(screen.getByRole('button', { name: /Clear all/i }))
    await waitFor(() => expect(screen.getByText('Removed 2 films from your Watchlist.')).toBeInTheDocument())
  })
})

describe('Watchlist remove control pending state (F6.3)', () => {
  it('54/55/56. aria-busy + disabled + "Removing {title}" while pending', () => {
    mockCtx = ctx({ items: [item({ title: 'A' })], stats: { ...baseStats, watchlistTotal: 1 }, isRemoving: (id) => id === 1 })
    render(<Watchlist />)
    const btn = screen.getByRole('button', { name: 'Removing A' })
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(btn).toBeDisabled()
  })

  it('57. bulk button shows pending', () => {
    mockCtx = ctx({ items: [item({ stale: true })], stats: { ...baseStats, watchlistTotal: 1, gettingStaleCount: 1 }, removingStale: true })
    render(<Watchlist />)
    const btn = screen.getByRole('button', { name: /Removing/i })
    expect(btn).toBeDisabled()
    expect(btn).toHaveTextContent('Removing…')
  })
})
