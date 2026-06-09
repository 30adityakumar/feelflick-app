import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'

const navigate = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))

let mockCtx
vi.mock('../useHistoryData', () => ({
  HistoryDataProvider: ({ children }) => children,
  useHistoryData: () => mockCtx,
}))

import History from '../History'

const baseStats = { totalLogged: 0, totalHours: 0, avgRating: 0, thisMonthCount: 0 }
const entry = (over = {}) => ({ id: 'e1', movieId: 1, tmdbId: 101, title: 'A', year: 2020, runtime: 100, dir: 'D', date: 'Mar 9', month: 'Mar 2026', day: 9, rating: 5, filmMood: 'Tender', mood: 'Tender', moodHex: '#A78BFA', context: 'Evening · Monday', review: null, note: null, poster: null, fav: true, ...over })

function ctx(over = {}) {
  return {
    entries: [], stats: baseStats, loading: false, error: null,
    isRemoving: () => false,
    removeEntry: vi.fn(async () => ({ ok: true, action: 'removed', entryId: 'e1', movieId: 1 })),
    refresh: vi.fn(),
    ...over,
  }
}

beforeEach(() => { navigate.mockClear() })
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('Diary load-error state — sanitized (F6.3)', () => {
  it('31/32/33. fixed safe copy (no raw backend text), one h1, role=alert', () => {
    mockCtx = ctx({ error: 'load_error' })
    const { container } = render(<History />)
    expect(screen.getByText('We couldn’t load your Diary.')).toBeInTheDocument()
    expect(screen.getByText(/Your watched films and notes are still safe/i)).toBeInTheDocument()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelector('[role="alert"]')).toBeTruthy()
    expect(container.textContent).not.toMatch(/PGRST|rls|policy|relation|supabase|permission|undefined/i)
  })

  it('34/35. Try again calls refresh; Go to Home routes to /home', () => {
    const refresh = vi.fn()
    mockCtx = ctx({ error: 'load_error', refresh })
    render(<History />)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refresh).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Go to Home' }))
    expect(navigate).toHaveBeenCalledWith('/home')
  })
})

describe('Diary live region + announcements (F6.3)', () => {
  it('42. exactly one polite/atomic region', () => {
    mockCtx = ctx({ entries: [entry()], stats: { ...baseStats, totalLogged: 1 } })
    const { container } = render(<History />)
    expect(container.querySelectorAll('[role="status"][aria-live="polite"][aria-atomic="true"]')).toHaveLength(1)
  })

  it('43/36. success announces after settlement (via the confirmation dialog)', async () => {
    mockCtx = ctx({ entries: [entry({ title: 'A' })], stats: { ...baseStats, totalLogged: 1 } })
    render(<History />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove A from diary' }))           // opens dialog
    fireEvent.click(screen.getByRole('button', { name: 'Remove from Diary' }))              // confirms
    await waitFor(() => expect(screen.getByText('Removed A from your Diary.')).toBeInTheDocument())
  })

  it('44/37. failure announces failure (entry retained)', async () => {
    mockCtx = ctx({
      entries: [entry({ title: 'A' })], stats: { ...baseStats, totalLogged: 1 },
      removeEntry: vi.fn(async () => ({ ok: false, action: 'remove_failed', entryId: 'e1', movieId: 1 })),
    })
    render(<History />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove A from diary' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove from Diary' }))
    await waitFor(() => expect(screen.getByText('Could not remove A from your Diary. Try again.')).toBeInTheDocument())
  })

  it('32. cancelling the dialog ("Keep entry") performs no delete', () => {
    const removeEntry = vi.fn(async () => ({ ok: true }))
    mockCtx = ctx({ entries: [entry({ title: 'A' })], stats: { ...baseStats, totalLogged: 1 }, removeEntry })
    render(<History />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove A from diary' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep entry' }))
    expect(removeEntry).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull() // dialog closed
  })
})

describe('Diary remove control pending state (F6.3)', () => {
  it('aria-busy + disabled + "Removing {title}" while pending', () => {
    mockCtx = ctx({ entries: [entry({ title: 'A' })], stats: { ...baseStats, totalLogged: 1 }, isRemoving: (id) => id === 'e1' })
    render(<History />)
    const btn = screen.getByRole('button', { name: 'Removing A' })
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(btn).toBeDisabled()
  })
})
