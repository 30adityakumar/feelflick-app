// src/features/discover/__tests__/DiscoverResult.test.jsx
// F3.4 — isolated tests for the extracted Discover result stage: StagePick + the
// AlternateCard / TrailerModal / StreamingChip sections + the useStreamingProvider
// / useCountUp / useDiscoverResultActions hooks. No live Discover mount, no live
// Supabase / TMDB / YouTube, no real writes — every dependency is mocked.
// Deferred per F3.4: a11y (aria-pressed / focus trap / single-h1) is NOT asserted.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, renderHook } from '@testing-library/react'

const h = vi.hoisted(() => ({ user: { id: 'u1' }, navigate: () => {}, inserts: [], insertError: null, providers: [] }))

vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: h.user }) }))
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => h.navigate }))
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: (table) => ({ insert: (row) => { h.inserts.push({ table, row }); return Promise.resolve({ error: h.insertError }) } }) },
}))
vi.mock('@/shared/services/recommendations', () => ({ updateImpression: vi.fn().mockResolvedValue(), logSurfaceImpressions: vi.fn().mockResolvedValue() }))
vi.mock('@/shared/services/interactions', () => ({ trackInteraction: vi.fn().mockResolvedValue() }))
vi.mock('@/shared/api/tmdb', () => ({ getMovieWatchProviders: vi.fn(() => Promise.resolve({ providers: h.providers })) }))

import StagePick from '../sections/StagePick'
import StreamingChip from '../sections/StreamingChip'
import TrailerModal from '../sections/TrailerModal'
import { useCountUp } from '../hooks/useCountUp'
import { updateImpression, logSurfaceImpressions } from '@/shared/services/recommendations'
import { trackInteraction } from '@/shared/services/interactions'

const film = (id, over = {}) => ({
  id, tmdbId: 100 + id, title: `Film${id}`, poster: `/p${id}.jpg`, dir: `Dir${id}`, year: 2000 + id,
  runtime: 100 + id, genre: 'Thriller', primary_genre: 'Thriller', match: 70 + id,
  fit: { tender: 0.8, tense: 0.5 }, moodFitRaw: 0.8, overview: `A long enough synopsis for film ${id} to render in the result.`,
  trailerKey: `key${id}`, _raw: { mood_tags: ['haunting'], tone_tags: [] }, ...over,
})
const baseProps = (over = {}) => ({
  selected: ['tender'], who: 'alone', energy: 'steady', intention: 'move',
  results: [film(1), film(2), film(3)], profile: { affinities: { directors: [] } },
  sessionShownIds: { current: new Set() }, onRestart: vi.fn(), onBack: vi.fn(),
  blendHex: '#A78BFA', audioToggle: <div data-testid="audio-toggle" />, ...over,
})

beforeEach(() => {
  h.user = { id: 'u1' }; h.navigate = vi.fn(); h.inserts = []; h.insertError = null; h.providers = []
  vi.clearAllMocks()
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
})

// ── StagePick render ──────────────────────────────────────────────────────────
describe('StagePick — render', () => {
  it('renders the top pick title, because-line, synopsis, taste chip and mood-fit ring', async () => {
    render(<StagePick {...baseProps()} />)
    expect(screen.getByRole('heading', { level: 1, name: /Film1/ })).toBeInTheDocument()
    expect(screen.getByText('For your soft focus night.')).toBeInTheDocument() // top pick because-line
    expect(screen.getByText(/A long enough synopsis for film 1/)).toBeInTheDocument()
    expect(screen.getByText(/% taste/)).toBeInTheDocument()
    expect(screen.getByText('Mood fit')).toBeInTheDocument()
  })
  it('renders two alternates + a queued count when more films remain', () => {
    render(<StagePick {...baseProps({ results: [film(1), film(2), film(3), film(4), film(5)] })} />)
    expect(screen.getByText('Film2')).toBeInTheDocument() // alternate
    expect(screen.getByText('Film3')).toBeInTheDocument() // alternate
    expect(screen.getByText(/more queued/)).toBeInTheDocument() // 2 queued (films 4,5)
  })
  it('renders the exhausted state when results are empty', () => {
    render(<StagePick {...baseProps({ results: [] })} />)
    expect(screen.getByText(/everything/)).toBeInTheDocument()
    expect(screen.getByText('End of edition')).toBeInTheDocument()
  })
  it('Start Over calls onRestart and Tweak Inputs calls onBack', () => {
    const p = baseProps()
    render(<StagePick {...p} />)
    fireEvent.click(screen.getByRole('button', { name: /start over/i }))
    fireEvent.click(screen.getByRole('button', { name: /tweak inputs/i }))
    expect(p.onRestart).toHaveBeenCalledTimes(1)
    expect(p.onBack).toHaveBeenCalledTimes(1)
  })
  it('clicking an alternate promotes it to the top slot', async () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByText('Film2').closest('button'))
    expect(await screen.findByRole('heading', { level: 1, name: /Film2/ })).toBeInTheDocument()
  })
})

// ── queue / action behavior ───────────────────────────────────────────────────
describe('StagePick — queue + actions', () => {
  it('Skip hides the current top and promotes the next film', async () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: /skip for tonight/i }))
    expect(await screen.findByRole('heading', { level: 1, name: /Film2/ })).toBeInTheDocument()
  })
  it('Mark Watched hides the current top and promotes the next film', async () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: /mark watched/i }))
    // the write resolves + the 600ms confirm hold fires → next pick promoted
    expect(await screen.findByRole('heading', { level: 1, name: /Film2/ }, { timeout: 2000 })).toBeInTheDocument()
  })
  it('Save flips the button to the saved state', async () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })
  it('records top + visible ids into sessionShownIds', () => {
    const sessionShownIds = { current: new Set() }
    render(<StagePick {...baseProps({ sessionShownIds })} />)
    expect(sessionShownIds.current.has(1)).toBe(true)
    expect(sessionShownIds.current.has(2)).toBe(true)
    expect(sessionShownIds.current.has(3)).toBe(true)
  })
  it('See More navigates to /movie/{tmdbId} and logs clicked impression + interaction', () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: /see more/i }))
    expect(h.navigate).toHaveBeenCalledWith('/movie/101')
    expect(updateImpression).toHaveBeenCalledWith('u1', 1, 'clicked')
    expect(trackInteraction).toHaveBeenCalledWith('click', expect.objectContaining({ movieId: 1, source: 'discover' }))
  })
  it('See More does not navigate when the top has no tmdbId', () => {
    render(<StagePick {...baseProps({ results: [film(1, { tmdbId: null })] })} />)
    fireEvent.click(screen.getByRole('button', { name: /see more/i }))
    expect(h.navigate).not.toHaveBeenCalled()
  })
  it('logs a reveal impression for the top pick', () => {
    render(<StagePick {...baseProps()} />)
    expect(logSurfaceImpressions).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', placement: 'discover' }))
  })
})

// ── write hook (component-driven) ─────────────────────────────────────────────
describe('useDiscoverResultActions — writes', () => {
  it('Save writes user_watchlist + flips the saved impression', async () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await screen.findByText('Saved')
    expect(h.inserts).toContainEqual({ table: 'user_watchlist', row: { user_id: 'u1', movie_id: 1 } })
    expect(updateImpression).toHaveBeenCalledWith('u1', 1, 'saved')
  })
  it('Save treats a 23505 duplicate as success', async () => {
    h.insertError = { code: '23505' }
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(await screen.findByText('Saved')).toBeInTheDocument() // not "Try again"
  })
  it('Save sets the error state on a non-23505 failure', async () => {
    h.insertError = { code: '500', message: 'boom' }
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(await screen.findByText('Try again')).toBeInTheDocument()
  })
  it('Mark Watched writes user_history (source discover_marked) + flips the watched impression', async () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: /mark watched/i }))
    await screen.findByText('Watched')
    expect(h.inserts).toContainEqual({ table: 'user_history', row: { user_id: 'u1', movie_id: 1, source: 'discover_marked' } })
    expect(updateImpression).toHaveBeenCalledWith('u1', 1, 'watched')
  })
  it('Skip flags the skipped impression + logs a dismiss interaction with Stage-2 metadata', () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: /skip for tonight/i }))
    expect(updateImpression).toHaveBeenCalledWith('u1', 1, 'skipped')
    expect(trackInteraction).toHaveBeenCalledWith('dismiss', expect.objectContaining({
      movieId: 1, source: 'discover',
      metadata: expect.objectContaining({ action: 'not_tonight', moods: ['tender'], intention: 'move', energy: 'steady', who: 'alone' }),
    }))
  })
  it('does not write to the watchlist when there is no user', async () => {
    h.user = null
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await Promise.resolve()
    expect(h.inserts).toHaveLength(0)
  })
})

// ── StreamingChip ─────────────────────────────────────────────────────────────
describe('StreamingChip', () => {
  it('renders nothing without a provider', () => {
    const { container } = render(<StreamingChip provider={null} />)
    expect(container).toBeEmptyDOMElement()
  })
  it('maps provider type to the priority label (flatrate → rent → buy)', () => {
    const { rerender } = render(<StreamingChip provider={{ type: 'flatrate', name: 'Netflix', logoPath: '/n.png' }} />)
    expect(screen.getByText('Streaming on')).toBeInTheDocument()
    rerender(<StreamingChip provider={{ type: 'rent', name: 'Apple TV', logoPath: '/a.png' }} />)
    expect(screen.getByText('Rent on')).toBeInTheDocument()
    rerender(<StreamingChip provider={{ type: 'buy', name: 'Amazon', logoPath: '/z.png' }} />)
    expect(screen.getByText('Buy on')).toBeInTheDocument()
  })
})

// ── TrailerModal ──────────────────────────────────────────────────────────────
describe('TrailerModal', () => {
  it('renders nothing when closed', () => {
    render(<TrailerModal open={false} youtubeKey="abc" title="X" onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('renders a portaled dialog and focuses the close button when open', async () => {
    render(<TrailerModal open youtubeKey="abc" title="X" onClose={() => {}} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: /close trailer/i })).toHaveFocus())
  })
  it('Escape closes the trailer', () => {
    const onClose = vi.fn()
    render(<TrailerModal open youtubeKey="abc" title="X" onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
  it('overlay click closes, inside click does not', () => {
    const onClose = vi.fn()
    render(<TrailerModal open youtubeKey="abc" title="X" onClose={onClose} />)
    const dialog = screen.getByRole('dialog')
    fireEvent.click(dialog) // overlay (target === currentTarget)
    expect(onClose).toHaveBeenCalledTimes(1)
    onClose.mockClear()
    fireEvent.click(dialog.lastElementChild) // the player wrapper (stopPropagation)
    expect(onClose).not.toHaveBeenCalled()
  })
})

// ── useCountUp ────────────────────────────────────────────────────────────────
describe('useCountUp', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())
  it('starts at 0', () => {
    const { result } = renderHook(() => useCountUp(50, 1400, 200))
    expect(result.current).toBe(0)
  })
  it('does not throw when unmounted before the animation runs', () => {
    const { unmount } = renderHook(() => useCountUp(50, 1400, 200))
    expect(() => { unmount(); vi.advanceTimersByTime(2000) }).not.toThrow()
  })
})
