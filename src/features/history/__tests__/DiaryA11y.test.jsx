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
vi.mock('../useHistoryData', () => ({ HistoryDataProvider: ({ children }) => children, useHistoryData: () => mockCtx }))
import History from '../History'

const stats = (over = {}) => ({ totalLogged: 1, totalHours: 2, avgRating: 4.5, thisMonthCount: 1, ...over })
const entry = (over = {}) => ({
  id: 'e1', movieId: 1, tmdbId: 101, title: 'Past Lives', year: 2023, runtime: 106, dir: 'Celine Song',
  date: 'Mar 9, 2026', month: 'Mar 2026', day: 9, watchedAt: '2026-03-09T20:30:00', watchedTs: new Date('2026-03-09T20:30:00').getTime(),
  watchedLabel: 'Watched Mar 9, 2026', rating: 5, rawRating: 10, filmMood: 'Tender', mood: 'Tender', moodHex: '#A78BFA',
  context: 'Evening · Monday', review: 'aching', note: 'aching', poster: null, fav: true, ...over,
})
function ctx(over = {}) {
  return { entries: [entry()], stats: stats(), loading: false, error: null, isRemoving: () => false, removeEntry: vi.fn(async () => ({ ok: true })), refresh: vi.fn(), ...over }
}
const renderAt = (path = '/history') => render(<MemoryRouter initialEntries={[path]}><History /></MemoryRouter>)

beforeEach(() => navigate.mockClear())
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('Diary — a11y/responsive hardening', () => {
  it('each diary row is exactly ONE Film File link + ONE Remove; the title is a heading, not a button', () => {
    mockCtx = ctx()
    renderAt()
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(1)
    const row = rows[0]
    expect(within(row).getAllByRole('link')).toHaveLength(1)
    expect(within(row).getByRole('link', { name: 'Open Past Lives' })).toHaveAttribute('href', '/movie/101')
    expect(within(row).getAllByRole('button')).toHaveLength(1) // only Remove
    expect(within(row).getByRole('heading', { name: 'Past Lives' })).toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: 'Past Lives' })).toBeNull()
  })

  it('a row WITHOUT a TMDB id renders non-interactively (no broken link) but keeps Remove', () => {
    mockCtx = ctx({ entries: [entry({ tmdbId: null })] })
    renderAt()
    const row = screen.getByRole('listitem')
    expect(within(row).queryAllByRole('link')).toHaveLength(0)
    expect(within(row).getByRole('heading', { name: 'Past Lives' })).toBeInTheDocument()
    expect(within(row).getAllByRole('button')).toHaveLength(1)
  })

  it('the filter is a labelled toggle-button group (aria-pressed, ≥44px), NOT a radiogroup', () => {
    mockCtx = ctx()
    renderAt()
    const group = screen.getByRole('group', { name: 'Filter diary' })
    expect(screen.queryByRole('radiogroup')).toBeNull()
    expect(screen.queryByRole('radio')).toBeNull()
    for (const b of within(group).getAllByRole('button')) {
      expect(b).toHaveAttribute('aria-pressed')
      expect(b.style.minHeight).toBe('44px')
    }
  })

  it('the Remove control has the library focus-recovery data hooks + a ≥44px target', () => {
    mockCtx = ctx()
    renderAt()
    const btn = screen.getByRole('button', { name: 'Remove Past Lives from Diary' })
    expect(btn).toHaveAttribute('data-library-action', 'remove')
    expect(btn).toHaveAttribute('data-library-item-id', 'e1')
    expect(btn).toHaveAttribute('data-library-view', 'diary')
    expect(btn.style.minHeight).toBe('44px')
    expect(btn.style.minWidth).toBe('44px')
  })

  it('diary entries are grouped in labelled lists with listitems', () => {
    mockCtx = ctx()
    renderAt()
    expect(screen.getAllByRole('list').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('listitem').length).toBe(1)
  })

  it('the timeline month heading is an <h2>', () => {
    mockCtx = ctx()
    renderAt()
    expect(screen.getByRole('heading', { level: 2, name: /Mar 2026/ })).toBeInTheDocument()
  })

  it('loading shows an honest busy status with a visually-hidden message', () => {
    mockCtx = ctx({ loading: true })
    renderAt()
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading your diary…')).toBeInTheDocument()
  })

  it('a search with no matches is announced via a constraint-aware role="status"', () => {
    mockCtx = ctx({ entries: [entry({ title: 'Past Lives' })], stats: stats({ totalLogged: 1 }) })
    renderAt()
    fireEvent.change(screen.getByLabelText('Search the Diary'), { target: { value: 'zzzzz' } })
    const statuses = screen.getAllByRole('status')
    expect(statuses.some((s) => /match your search/i.test(s.textContent))).toBe(true)
  })
})
