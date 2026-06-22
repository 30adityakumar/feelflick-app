import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const navigate = vi.fn()
vi.mock('react-router-dom', async (orig) => {
  const actual = await orig()
  return { ...actual, useNavigate: () => navigate }
})
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))

let mockCtx
vi.mock('../useHistoryData', () => ({
  HistoryDataProvider: ({ children }) => children,
  useHistoryData: () => mockCtx,
}))

import History from '../History'

const stats = (over = {}) => ({ totalLogged: 2, totalHours: 4, avgRating: 4.5, thisMonthCount: 1, ...over })
const entry = (over = {}) => ({
  id: 'e1', movieId: 1, tmdbId: 101, title: 'Past Lives', year: 2023, runtime: 106, dir: 'Celine Song',
  date: 'Mar 9, 2026', month: 'Mar 2026', day: 9, watchedAt: '2026-03-09T20:30:00', watchedTs: new Date('2026-03-09T20:30:00').getTime(),
  watchedLabel: 'Watched Mar 9, 2026', rating: 5, rawRating: 10, filmMood: 'Tender', mood: 'Tender', moodHex: '#A78BFA',
  context: 'Evening · Monday', review: 'Quiet and aching.', note: 'Quiet and aching.', poster: null, fav: true, ...over,
})

function ctx(over = {}) {
  return { entries: [entry()], stats: stats(), loading: false, error: null, isRemoving: () => false, removeEntry: vi.fn(async () => ({ ok: true })), refresh: vi.fn(), ...over }
}
const renderAt = (path = '/history') => render(<MemoryRouter initialEntries={[path]}><History /></MemoryRouter>)

beforeEach(() => navigate.mockClear())
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('Diary — data-truth + reflection labelling', () => {
  it('keeps the Diary identity and exactly one h1 ("Diary")', () => {
    mockCtx = ctx()
    const { container } = renderAt()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Diary' })).toBeInTheDocument()
  })

  it('eyebrow "Your library" + truthful chronological subtitle (films you watched)', () => {
    mockCtx = ctx()
    renderAt()
    expect(screen.getByText('Your library')).toBeInTheDocument()
    expect(screen.getByText(/A chronological record of films you watched and what you thought/i)).toBeInTheDocument()
  })

  it('no streak / gamification / match-% text anywhere', () => {
    mockCtx = ctx()
    const { container } = renderAt()
    expect(container.textContent).not.toMatch(/streak|consecutive days|🔥|match %|% match|achievement|rewatch/i)
  })

  it('compact stats: truthful labels + Diary-scoped average value', () => {
    mockCtx = ctx({ stats: stats({ avgRating: 4.5 }) })
    renderAt()
    expect(screen.getByText('Films logged')).toBeInTheDocument()
    expect(screen.getByText('Runtime logged')).toBeInTheDocument()
    expect(screen.getByText('Avg rating')).toBeInTheDocument()
    expect(screen.getByText('This month')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  it('the Loved filter is a labelled toggle button (aria-pressed), basis 9–10', () => {
    mockCtx = ctx()
    renderAt()
    const loved = screen.getByRole('button', { name: 'Loved · 9–10' })
    expect(loved).toHaveAttribute('aria-pressed')
    expect(screen.queryByText(/Loved \(5/)).toBeNull()
  })

  it('the mood pill accessible name says "Film mood" (not the user\'s mood)', () => {
    mockCtx = ctx()
    renderAt()
    expect(screen.getByRole('img', { name: 'Film mood: Tender' })).toBeInTheDocument()
  })

  it('the review is labelled "Your review"', () => {
    mockCtx = ctx()
    renderAt()
    expect(screen.getByText('Your review')).toBeInTheDocument()
    expect(screen.getByText(/Quiet and aching/)).toBeInTheDocument()
  })

  it('search matches title / director / review but NOT film mood', () => {
    mockCtx = ctx({
      entries: [
        entry({ id: 'e1', movieId: 1, title: 'Past Lives', dir: 'Celine Song', review: 'aching', filmMood: 'Tender' }),
        entry({ id: 'e2', movieId: 2, title: 'Aftersun', dir: 'Charlotte Wells', review: 'sunlit grief', filmMood: 'Melancholy', tmdbId: 102 }),
      ],
      stats: stats({ totalLogged: 2 }),
    })
    renderAt()
    const search = screen.getByLabelText('Search the Diary')

    fireEvent.change(search, { target: { value: 'aftersun' } })       // title
    expect(screen.queryByText('Aftersun')).toBeInTheDocument(); expect(screen.queryByText('Past Lives')).toBeNull()

    fireEvent.change(search, { target: { value: 'celine' } })         // director
    expect(screen.queryByText('Past Lives')).toBeInTheDocument(); expect(screen.queryByText('Aftersun')).toBeNull()

    fireEvent.change(search, { target: { value: 'sunlit' } })         // review
    expect(screen.queryByText('Aftersun')).toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'melancholy' } })     // FILM MOOD → no match
    expect(screen.queryByText('Past Lives')).toBeNull()
    expect(screen.queryByText('Aftersun')).toBeNull()
    expect(screen.getByText(/match your search/i)).toBeInTheDocument()
  })

  it('one persistent polite/atomic live region + pending Remove control', () => {
    mockCtx = ctx({ isRemoving: (id) => id === 'e1' })
    const { container } = renderAt()
    expect(container.querySelectorAll('[role="status"][aria-live="polite"][aria-atomic="true"]')).toHaveLength(1)
    const btn = screen.getByRole('button', { name: 'Removing Past Lives' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })
})

describe('Diary — shared Library identity + cross-navigation', () => {
  it('the Library nav marks Diary active and links Watchlist → /watchlist', () => {
    mockCtx = ctx()
    renderAt()
    const nav = screen.getByRole('navigation', { name: 'Library sections' })
    expect(within(nav).getByRole('link', { name: 'Diary' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Watchlist' })).toHaveAttribute('href', '/watchlist')
  })

  it('statistics + search/filter/sort controls remain', () => {
    mockCtx = ctx({ stats: stats({ avgRating: 4.5, totalLogged: 2, totalHours: 4 }) })
    renderAt()
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByLabelText('Search the Diary')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Loved · 9–10' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Sort diary' })).toBeInTheDocument()
  })

  it('the section nav is present in the empty AND the load-error states (one h1 each)', () => {
    mockCtx = ctx({ entries: [], stats: stats({ totalLogged: 0 }) })
    const { rerender } = renderAt()
    expect(screen.getByRole('navigation', { name: 'Library sections' })).toBeInTheDocument()
    mockCtx = ctx({ error: 'load_error' })
    rerender(<MemoryRouter initialEntries={['/history']}><History /></MemoryRouter>)
    expect(screen.getByRole('navigation', { name: 'Library sections' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(document.querySelectorAll('h1')).toHaveLength(1)
  })
})
