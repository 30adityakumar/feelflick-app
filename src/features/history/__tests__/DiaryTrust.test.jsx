import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'

const navigate = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate, Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))

let mockCtx
vi.mock('../useHistoryData', () => ({
  HistoryDataProvider: ({ children }) => children,
  useHistoryData: () => mockCtx,
}))

import History from '../History'

const stats = (over = {}) => ({ totalLogged: 2, totalHours: 4, avgRating: 4.5, thisMonthCount: 1, ...over })
const entry = (over = {}) => ({ id: 'e1', movieId: 1, tmdbId: 101, title: 'Past Lives', year: 2023, runtime: 106, dir: 'Celine Song', date: 'Mar 9', month: 'Mar 2026', day: 9, rating: 5, filmMood: 'Tender', mood: 'Tender', moodHex: '#A78BFA', context: 'Evening · Monday', review: 'Quiet and aching.', note: 'Quiet and aching.', poster: null, fav: true, ...over })

function ctx(over = {}) {
  return { entries: [entry()], stats: stats(), loading: false, error: null, isRemoving: () => false, removeEntry: vi.fn(async () => ({ ok: true })), refresh: vi.fn(), ...over }
}

beforeEach(() => navigate.mockClear())
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('Diary — data-truth + reflection labelling (F6.5)', () => {
  it('16/26. keeps the Diary identity and exactly one h1', () => {
    mockCtx = ctx()
    const { container } = render(<History />)
    expect(screen.getAllByText('Diary').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('h1')).toHaveLength(1)
  })

  it('17. no streak text / icon / card anywhere', () => {
    mockCtx = ctx()
    const { container } = render(<History />)
    expect(container.textContent).not.toMatch(/streak|day streak|consecutive days|🔥/i)
  })

  it('18. shows a Diary-scoped average rating (and labels it as rated diary films)', () => {
    mockCtx = ctx({ stats: stats({ avgRating: 4.5 }) })
    render(<History />)
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText(/rated diary films/i)).toBeInTheDocument()
  })

  it('19. the Loved filter is labelled by its rating basis (9–10), not a separate flag', () => {
    mockCtx = ctx()
    render(<History />)
    expect(screen.getByRole('radio', { name: 'Loved · 9–10' })).toBeInTheDocument()
    expect(screen.queryByText(/Loved \(5/)).toBeNull()
  })

  it('20. the mood pill accessible name says "Film mood" (not the user\'s mood)', () => {
    mockCtx = ctx()
    render(<History />)
    expect(screen.getByRole('img', { name: 'Film mood: Tender' })).toBeInTheDocument()
  })

  it('21. the review is labelled "Your review"', () => {
    mockCtx = ctx()
    render(<History />)
    expect(screen.getByText('Your review')).toBeInTheDocument()
    expect(screen.getByText(/Quiet and aching/)).toBeInTheDocument()
  })

  it('22-25. search matches title / director / review but NOT film mood', () => {
    mockCtx = ctx({
      entries: [
        entry({ id: 'e1', movieId: 1, title: 'Past Lives', dir: 'Celine Song', review: 'aching', filmMood: 'Tender' }),
        entry({ id: 'e2', movieId: 2, title: 'Aftersun', dir: 'Charlotte Wells', review: 'sunlit grief', filmMood: 'Melancholy' }),
      ],
      stats: stats({ totalLogged: 2 }),
    })
    render(<History />)
    const search = screen.getByLabelText('Search the diary')

    fireEvent.change(search, { target: { value: 'aftersun' } })       // title
    expect(screen.queryByText('Aftersun')).toBeInTheDocument(); expect(screen.queryByText('Past Lives')).toBeNull()

    fireEvent.change(search, { target: { value: 'celine' } })         // director
    expect(screen.queryByText('Past Lives')).toBeInTheDocument(); expect(screen.queryByText('Aftersun')).toBeNull()

    fireEvent.change(search, { target: { value: 'sunlit' } })         // review
    expect(screen.queryByText('Aftersun')).toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'melancholy' } })     // FILM MOOD → no match
    expect(screen.queryByText('Past Lives')).toBeNull()
    expect(screen.queryByText('Aftersun')).toBeNull()
    expect(screen.getByText(/match/i)).toBeInTheDocument()            // filtered-empty notice
  })

  it('27/28. one persistent polite/atomic live region + pending Remove control', () => {
    mockCtx = ctx({ isRemoving: (id) => id === 'e1' })
    const { container } = render(<History />)
    expect(container.querySelectorAll('[role="status"][aria-live="polite"][aria-atomic="true"]')).toHaveLength(1)
    const btn = screen.getByRole('button', { name: 'Removing Past Lives' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })
})

describe('Diary — shared Library identity + cross-navigation (F6.6)', () => {
  it('23/24/25/28. eyebrow "Your library", h1 "Your diary.", chronological supporting copy, one h1', () => {
    mockCtx = ctx()
    const { container } = render(<History />)
    expect(screen.getByText('Your library')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /Your diary\./i })).toBeInTheDocument()
    expect(screen.getByText(/A chronological record of what you watched and what you thought/i)).toBeInTheDocument()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
  })

  it('26/27. the Library nav marks Diary active and links Watchlist → /watchlist', () => {
    mockCtx = ctx()
    render(<History />)
    const nav = screen.getByRole('navigation', { name: 'Library sections' })
    expect(within(nav).getByRole('link', { name: 'Diary' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Watchlist' })).toHaveAttribute('href', '/watchlist')
  })

  it('29/30. statistics + search/filter/sort controls remain', () => {
    mockCtx = ctx({ stats: stats({ avgRating: 4.5, totalLogged: 2, totalHours: 4 }) })
    render(<History />)
    expect(screen.getByText('4.5')).toBeInTheDocument()                       // average stat
    expect(screen.getByLabelText('Search the diary')).toBeInTheDocument()      // search
    expect(screen.getByRole('radio', { name: 'Loved · 9–10' })).toBeInTheDocument() // filter
    expect(screen.getByRole('combobox', { name: 'Sort diary' })).toBeInTheDocument() // sort
  })

  it('31/32. the section nav is present in the empty AND the load-error states (one h1 each)', () => {
    mockCtx = ctx({ entries: [], stats: stats({ totalLogged: 0 }) })
    const { rerender } = render(<History />)
    expect(screen.getByRole('navigation', { name: 'Library sections' })).toBeInTheDocument()
    mockCtx = ctx({ error: 'load_error' })
    rerender(<History />)
    expect(screen.getByRole('navigation', { name: 'Library sections' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(document.querySelectorAll('h1')).toHaveLength(1)
  })
})
