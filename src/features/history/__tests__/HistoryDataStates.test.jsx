import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const navigate = vi.fn()
vi.mock('react-router-dom', async (orig) => {
  const actual = await orig()
  return { ...actual, useNavigate: () => navigate }
})
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))

let mockCtx
vi.mock('../useHistoryData', () => ({ HistoryDataProvider: ({ children }) => children, useHistoryData: () => mockCtx }))
import History from '../History'

const baseStats = { totalLogged: 0, totalHours: 0, avgRating: 0, thisMonthCount: 0 }
const entry = (over = {}) => ({
  id: 'e1', movieId: 1, tmdbId: 101, title: 'A', year: 2020, runtime: 100, dir: 'D',
  date: 'Mar 9, 2026', month: 'Mar 2026', day: 9, watchedAt: '2026-03-09T20:00:00', watchedTs: new Date('2026-03-09T20:00:00').getTime(),
  watchedLabel: 'Watched Mar 9, 2026', rating: 5, rawRating: 10, filmMood: 'Tender', mood: 'Tender', moodHex: '#A78BFA',
  context: 'Evening · Monday', review: null, note: null, poster: null, fav: true, ...over,
})
function ctx(over = {}) {
  return {
    entries: [], stats: baseStats, loading: false, error: null, isRemoving: () => false,
    removeEntry: vi.fn(async () => ({ ok: true, action: 'removed', entryId: 'e1', movieId: 1 })), refresh: vi.fn(), ...over,
  }
}
const renderAt = (path = '/history') => render(<MemoryRouter initialEntries={[path]}><History /></MemoryRouter>)

beforeEach(() => navigate.mockClear())
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('Diary load-error state — sanitized (either read failing)', () => {
  it('fixed safe copy (no raw backend text), one h1, role=alert, keeps nav', () => {
    mockCtx = ctx({ error: 'load_error' })
    const { container } = renderAt()
    expect(screen.getByText('We couldn’t load your Diary.')).toBeInTheDocument()
    expect(screen.getByText(/Your watched films and notes are still safe/i)).toBeInTheDocument()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelector('[role="alert"]')).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Library sections' })).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/PGRST|rls|policy|relation|supabase|permission|undefined/i)
  })

  it('Try again calls refresh; Go to Home routes to /home', () => {
    const refresh = vi.fn()
    mockCtx = ctx({ error: 'load_error', refresh })
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refresh).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Go to Home' }))
    expect(navigate).toHaveBeenCalledWith('/home')
  })
})

describe('Diary completely-empty state', () => {
  it('truthful "open Diary" copy + Browse picks (/home) and Browse films (/browse); nav stays; no retrieval', () => {
    mockCtx = ctx({ entries: [], stats: baseStats })
    renderAt()
    expect(screen.getByText('Your Diary is open.')).toBeInTheDocument()
    expect(screen.getByText(/Mark a film watched and it will appear here/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Browse tonight’s picks/ })).toHaveAttribute('href', '/home')
    expect(screen.getByRole('link', { name: 'Browse films' })).toHaveAttribute('href', '/browse')
    expect(screen.getByRole('navigation', { name: 'Library sections' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Search the Diary')).toBeNull()
  })
})

describe('Diary live region + removal announcements', () => {
  it('exactly one polite/atomic region', () => {
    mockCtx = ctx({ entries: [entry()], stats: { ...baseStats, totalLogged: 1 } })
    const { container } = renderAt()
    expect(container.querySelectorAll('[role="status"][aria-live="polite"][aria-atomic="true"]')).toHaveLength(1)
  })

  it('success announces after settlement (via the confirmation dialog) and closes the dialog', async () => {
    mockCtx = ctx({ entries: [entry({ title: 'A' })], stats: { ...baseStats, totalLogged: 1 } })
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: 'Remove A from Diary' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove from Diary' }))
    // The settled message appears in the SR live region AND the visual toast.
    await waitFor(() => expect(screen.getAllByText('Removed A from your Diary.').length).toBeGreaterThan(0))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('failure announces failure, KEEPS the dialog open (error state), and retains the entry', async () => {
    mockCtx = ctx({
      entries: [entry({ title: 'A' })], stats: { ...baseStats, totalLogged: 1 },
      removeEntry: vi.fn(async () => ({ ok: false, action: 'remove_failed', entryId: 'e1', movieId: 1 })),
    })
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: 'Remove A from Diary' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove from Diary' }))
    await waitFor(() => expect(screen.getByText('Could not remove A from your Diary. Try again.')).toBeInTheDocument())
    expect(screen.getByRole('dialog')).toBeInTheDocument() // stays open in the error state
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'A' })).toBeInTheDocument() // row retained
  })

  it('the dialog STAYS OPEN and disables both actions while the delete is in flight', async () => {
    let resolve
    mockCtx = ctx({
      entries: [entry({ title: 'A' })], stats: { ...baseStats, totalLogged: 1 },
      removeEntry: vi.fn(() => new Promise((r) => { resolve = r })),
    })
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: 'Remove A from Diary' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove from Diary' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Removing…' })).toBeInTheDocument())
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-busy', 'true')
    expect(within(dialog).getByRole('button', { name: 'Keep entry' })).toBeDisabled()
    expect(within(dialog).getByRole('button', { name: 'Removing…' })).toBeDisabled()
    resolve({ ok: true })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('cancelling the dialog ("Keep entry") performs no delete and closes', () => {
    const removeEntry = vi.fn(async () => ({ ok: true }))
    mockCtx = ctx({ entries: [entry({ title: 'A' })], stats: { ...baseStats, totalLogged: 1 }, removeEntry })
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: 'Remove A from Diary' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep entry' }))
    expect(removeEntry).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('Diary remove control pending state', () => {
  it('aria-busy + disabled + "Removing {title}" while the provider reports in-flight', () => {
    mockCtx = ctx({ entries: [entry({ title: 'A' })], stats: { ...baseStats, totalLogged: 1 }, isRemoving: (id) => id === 'e1' })
    renderAt()
    const btn = screen.getByRole('button', { name: 'Removing A' })
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(btn).toBeDisabled()
  })
})
