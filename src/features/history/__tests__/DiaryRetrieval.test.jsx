import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'

const navigate = vi.fn()
vi.mock('react-router-dom', async (orig) => {
  const actual = await orig()
  return { ...actual, useNavigate: () => navigate }
})
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))

let mockCtx
vi.mock('../useHistoryData', () => ({ HistoryDataProvider: ({ children }) => children, useHistoryData: () => mockCtx }))
import History from '../History'

const ts = (s) => new Date(s).getTime()
const E = (over) => ({
  tmdbId: 100 + over.movieId, year: 2020, dir: 'Dir', filmMood: 'Tender', mood: 'Tender', moodHex: '#888',
  date: 'Mar 9, 2026', month: 'Mar 2026', day: 9, watchedAt: '2026-03-09T20:00:00', watchedTs: ts('2026-03-09T20:00:00'),
  watchedLabel: 'Watched Mar 9, 2026', review: null, note: null, poster: null, ...over,
  fav: typeof over.rawRating === 'number' && over.rawRating >= 9,
  rating: over.rawRating ? Math.round(over.rawRating / 2) : 0,
})
const ENTRIES = [
  E({ id: 'a', movieId: 1, title: 'Alpha', rawRating: 10, runtime: 100, watchedAt: '2026-03-02T20:00:00', watchedTs: ts('2026-03-02T20:00:00'), month: 'Mar 2026' }),
  E({ id: 'b', movieId: 2, title: 'Bravo', rawRating: 9, runtime: 120, watchedAt: '2026-02-20T20:00:00', watchedTs: ts('2026-02-20T20:00:00'), month: 'Feb 2026' }),
  E({ id: 'c', movieId: 3, title: 'Charlie', rawRating: null, runtime: 0, watchedAt: '2026-03-05T20:00:00', watchedTs: ts('2026-03-05T20:00:00'), month: 'Mar 2026' }),
  E({ id: 'd', movieId: 4, title: 'Delta', rawRating: 8, runtime: 90, watchedAt: '2026-02-10T20:00:00', watchedTs: ts('2026-02-10T20:00:00'), month: 'Feb 2026' }),
]
const stats = { totalLogged: 4, totalHours: 5, avgRating: 4.5, thisMonthCount: 2 }
function ctx(over = {}) {
  return { entries: ENTRIES, stats, loading: false, error: null, isRemoving: () => false, removeEntry: vi.fn(async () => ({ ok: true })), refresh: vi.fn(), ...over }
}
function LocationProbe() { const l = useLocation(); return <span data-testid="loc">{l.search}</span> }
const renderAt = (path = '/history') =>
  render(<MemoryRouter initialEntries={[path]}><History /><LocationProbe /></MemoryRouter>)
const titleOrder = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)

beforeEach(() => { mockCtx = ctx(); navigate.mockClear() })
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('Diary retrieval — URL-backed filter + sort, local search', () => {
  it('default view is the chronological timeline (month headings), newest month first', () => {
    renderAt('/history')
    expect(screen.getByRole('heading', { level: 2, name: /Mar 2026/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /Feb 2026/ })).toBeInTheDocument()
    // rows carry no "Watched …" label in the grouped view (the day header carries the date)
    expect(screen.queryByText(/^Watched /)).toBeNull()
  })

  it('Highest rated → FLAT list by RAW rating (10 before 9), unrated LAST', () => {
    renderAt('/history?sort=rating')
    expect(screen.getByRole('heading', { level: 2, name: /highest rated/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: /2026/ })).toBeNull() // no month containers
    expect(titleOrder()).toEqual(['Alpha', 'Bravo', 'Delta', 'Charlie'])
    expect(screen.getAllByText(/^Watched /).length).toBe(4) // each flat row shows its watched date
  })

  it('Runtime → FLAT list by runtime ascending, unknown/0 LAST', () => {
    renderAt('/history?sort=runtime')
    expect(titleOrder()).toEqual(['Delta', 'Alpha', 'Bravo', 'Charlie'])
  })

  it('?filter=loved keeps only raw 9–10', () => {
    renderAt('/history?filter=loved')
    expect(titleOrder().sort()).toEqual(['Alpha', 'Bravo'])
  })

  it('invalid ?filter / ?sort fall back to All / Most recent', () => {
    renderAt('/history?filter=bogus&sort=nope')
    expect(screen.getByRole('combobox', { name: 'Sort diary' })).toHaveValue('recent')
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('selecting Loved writes ?filter=loved; default All clears it', () => {
    renderAt('/history')
    fireEvent.click(screen.getByRole('button', { name: 'Loved · 9–10' }))
    expect(screen.getByTestId('loc')).toHaveTextContent('filter=loved')
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByTestId('loc').textContent).not.toMatch(/filter=/)
  })

  it('changing sort writes ?sort=; recent clears it', () => {
    renderAt('/history')
    fireEvent.change(screen.getByRole('combobox', { name: 'Sort diary' }), { target: { value: 'rating' } })
    expect(screen.getByTestId('loc')).toHaveTextContent('sort=rating')
    fireEvent.change(screen.getByRole('combobox', { name: 'Sort diary' }), { target: { value: 'recent' } })
    expect(screen.getByTestId('loc').textContent).not.toMatch(/sort=/)
  })

  it('search is LOCAL only — never written to the URL', () => {
    renderAt('/history')
    fireEvent.change(screen.getByLabelText('Search the Diary'), { target: { value: 'alpha' } })
    expect(titleOrder()).toEqual(['Alpha'])
    expect(screen.getByTestId('loc').textContent).not.toMatch(/alpha|search/i)
  })

  it('"Show all" from the filtered-empty state clears search, restores results, keeps sort', () => {
    renderAt('/history?sort=rating')
    fireEvent.change(screen.getByLabelText('Search the Diary'), { target: { value: 'zzzzz' } })
    expect(screen.getByText(/match your search/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show all' }))
    expect(titleOrder()).toEqual(['Alpha', 'Bravo', 'Delta', 'Charlie']) // back to the rating sort
    expect(screen.getByLabelText('Search the Diary')).toHaveValue('')
  })
})
