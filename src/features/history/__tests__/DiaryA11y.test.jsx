import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'

const navigate = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate, Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))

let mockCtx
vi.mock('../useHistoryData', () => ({ HistoryDataProvider: ({ children }) => children, useHistoryData: () => mockCtx }))
import History from '../History'

const stats = (over = {}) => ({ totalLogged: 1, totalHours: 2, avgRating: 4.5, thisMonthCount: 1, ...over })
const entry = (over = {}) => ({ id: 'e1', movieId: 1, tmdbId: 101, title: 'Past Lives', year: 2023, runtime: 106, dir: 'Celine Song', date: 'Mar 9', month: 'Mar 2026', day: 9, rating: 5, filmMood: 'Tender', mood: 'Tender', moodHex: '#A78BFA', context: 'Evening · Monday', review: 'aching', note: 'aching', poster: null, fav: true, ...over })
function ctx(over = {}) {
  return { entries: [entry()], stats: stats(), loading: false, error: null, isRemoving: () => false, removeEntry: vi.fn(async () => ({ ok: true })), refresh: vi.fn(), ...over }
}

beforeEach(() => navigate.mockClear())
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('Diary — a11y/responsive hardening (F6.7)', () => {
  it('each diary row is exactly ONE Film File link (poster) + ONE Remove; the title is a heading, not a button', () => {
    mockCtx = ctx()
    render(<History />)
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(1)
    const row = rows[0]
    expect(within(row).getAllByRole('link')).toHaveLength(1)
    expect(within(row).getByRole('link', { name: 'Open Past Lives' })).toHaveAttribute('href', '/movie/101')
    expect(within(row).getAllByRole('button')).toHaveLength(1) // only Remove
    expect(within(row).getByRole('heading', { name: 'Past Lives' })).toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: 'Past Lives' })).toBeNull()
  })

  it('the filter is a labelled toggle-button group (aria-pressed), NOT a radiogroup', () => {
    mockCtx = ctx()
    render(<History />)
    const group = screen.getByRole('group', { name: 'Filter diary' })
    expect(screen.queryByRole('radiogroup')).toBeNull()
    expect(screen.queryByRole('radio')).toBeNull()
    for (const b of within(group).getAllByRole('button')) {
      expect(b).toHaveAttribute('aria-pressed')
      expect(b.style.minHeight).toBe('44px')
    }
  })

  it('diary entries are grouped in labelled lists with listitems', () => {
    mockCtx = ctx()
    render(<History />)
    const lists = screen.getAllByRole('list')
    expect(lists.length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('listitem').length).toBe(1)
  })

  it('loading shows an honest busy status with a visually-hidden message', () => {
    mockCtx = ctx({ loading: true })
    render(<History />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading your diary…')).toBeInTheDocument()
  })

  it('a search with no matches is announced via role="status"', () => {
    mockCtx = ctx({ entries: [entry({ title: 'Past Lives' })], stats: stats({ totalLogged: 1 }) })
    render(<History />)
    fireEvent.change(screen.getByLabelText('Search the diary'), { target: { value: 'zzzzz' } })
    const statuses = screen.getAllByRole('status') // persistent live region + the empty notice
    expect(statuses.some(s => /0 of 1 match/i.test(s.textContent))).toBe(true)
  })
})
