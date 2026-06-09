// src/features/discover/__tests__/DiscoverResult.test.jsx
// F3.8 — the one-pick Discover result. StagePick now shows exactly ONE film with an
// honest "Why this one" case; the ranked list stays internal (Not tonight / Already
// watched promote the next-best). No visible alternates, no queue count, no match
// percentages, no parallax. All writes/handlers + the StreamingChip / TrailerModal
// sections are unchanged. Everything mocked — no live mount/Supabase/TMDB/YouTube.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act, renderHook } from '@testing-library/react'
import { useState } from 'react'

const h = vi.hoisted(() => ({ user: { id: 'u1' }, navigate: () => {}, inserts: [], insertError: null, providers: [], providerError: false }))

vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: h.user }) }))
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => h.navigate }))
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: (table) => ({ insert: (row) => { h.inserts.push({ table, row }); return Promise.resolve({ error: h.insertError }) } }) },
}))
vi.mock('@/shared/services/recommendations', () => ({ updateImpression: vi.fn().mockResolvedValue(), logSurfaceImpressions: vi.fn().mockResolvedValue() }))
vi.mock('@/shared/services/interactions', () => ({ trackInteraction: vi.fn().mockResolvedValue() }))
vi.mock('@/shared/api/tmdb', () => ({ getMovieWatchProviders: vi.fn(() => h.providerError ? Promise.reject(new Error('tmdb down')) : Promise.resolve({ providers: h.providers })) }))

import StagePick from '../sections/StagePick'
import StreamingChip from '../sections/StreamingChip'
import TrailerModal from '../sections/TrailerModal'
import { useStreamingProvider } from '../hooks/useStreamingProvider'
import { buildRuntimeFitLine } from '../resultPresentation'
import { updateImpression, logSurfaceImpressions } from '@/shared/services/recommendations'
import { trackInteraction } from '@/shared/services/interactions'

// runtime defaults to 101 (inside the 'std' [100,130] band → a true runtime-fit line)
const film = (id, over = {}) => ({
  id, tmdbId: 100 + id, title: `Film${id}`, poster: `/p${id}.jpg`, dir: `Dir${id}`, year: 2000 + id,
  runtime: 101, genre: 'Thriller', primary_genre: 'Thriller', match: 70 + id,
  fit: { tender: 0.8, tense: 0.5 }, moodFitRaw: 0.8, overview: `A long enough synopsis for film ${id} to render in the result.`,
  trailerKey: `key${id}`, _raw: { mood_tags: ['haunting'], tone_tags: [] }, ...over,
})
const baseProps = (over = {}) => ({
  selected: ['tender'], who: 'alone', energy: 'steady', intention: 'move', time: 'std',
  results: [film(1), film(2), film(3)], profile: { affinities: { directors: [] } },
  sessionShownIds: { current: new Set() }, onRestart: vi.fn(), onBack: vi.fn(),
  blendHex: '#A78BFA', audioToggle: <div data-testid="audio-toggle" />, ...over,
})
const titleHeading = (name) => screen.getByRole('heading', { level: 1, name })

beforeEach(() => {
  h.user = { id: 'u1' }; h.navigate = vi.fn(); h.inserts = []; h.insertError = null; h.providers = []; h.providerError = false
  vi.clearAllMocks()
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
})

// ── buildRuntimeFitLine ───────────────────────────────────────────────────────
describe('buildRuntimeFitLine', () => {
  it('returns a fit line for each valid band', () => {
    expect(buildRuntimeFitLine({ time: 'short', runtime: 80 })).toBe('Within your ~ 90 min window.')
    expect(buildRuntimeFitLine({ time: 'std', runtime: 120 })).toBe('Within your ~ 2 hrs window.')
    expect(buildRuntimeFitLine({ time: 'long', runtime: 145 })).toBe('Within your ~ 2.5 hrs window.')
    expect(buildRuntimeFitLine({ time: 'epic', runtime: 200 })).toBe('Within your 3 hrs+ window.')
  })
  it('includes the band boundaries', () => {
    expect(buildRuntimeFitLine({ time: 'std', runtime: 100 })).toBe('Within your ~ 2 hrs window.') // lower
    expect(buildRuntimeFitLine({ time: 'std', runtime: 130 })).toBe('Within your ~ 2 hrs window.') // upper
  })
  it('returns null just outside the band', () => {
    expect(buildRuntimeFitLine({ time: 'std', runtime: 99 })).toBeNull()
    expect(buildRuntimeFitLine({ time: 'std', runtime: 131 })).toBeNull()
  })
  it('returns null for unknown time / missing / non-numeric runtime', () => {
    expect(buildRuntimeFitLine({ time: 'nope', runtime: 120 })).toBeNull()
    expect(buildRuntimeFitLine({ time: 'std', runtime: undefined })).toBeNull()
    expect(buildRuntimeFitLine({ time: 'std', runtime: NaN })).toBeNull()
    expect(buildRuntimeFitLine({ time: 'std', runtime: '120' })).toBeNull()
  })
  it('does not mutate its input', () => {
    const arg = { time: 'std', runtime: 120 }
    const snap = { ...arg }
    buildRuntimeFitLine(arg)
    expect(arg).toEqual(snap)
  })
})

// ── one-pick rendering ────────────────────────────────────────────────────────
describe('StagePick — one-pick render', () => {
  it('renders exactly one film title from the result list', () => {
    render(<StagePick {...baseProps()} />)
    expect(titleHeading('Film1')).toBeInTheDocument()
    expect(screen.queryByText('Film2')).not.toBeInTheDocument()
    expect(screen.queryByText('Film3')).not.toBeInTheDocument()
  })
  it('does not render alternates / queue language', () => {
    render(<StagePick {...baseProps({ results: [film(1), film(2), film(3), film(4), film(5)] })} />)
    expect(screen.queryByText(/Or pick from these/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/more queued/i)).not.toBeInTheDocument()
  })
  it('renders the "Tonight’s pick" eyebrow + the "Why this one" case with the because + runtime lines', () => {
    render(<StagePick {...baseProps()} />)
    expect(screen.getByText(/^Tonight.s pick$/)).toBeInTheDocument()
    expect(screen.getByText('Why this one')).toBeInTheDocument()
    expect(screen.getByText('For your soft focus night.')).toBeInTheDocument() // becauseLine
    expect(screen.getByText('Within your ~ 2 hrs window.')).toBeInTheDocument() // runtime fit (101 ∈ std)
  })
  it('omits the runtime-fit line when the runtime is outside the selected band', () => {
    render(<StagePick {...baseProps({ time: 'short' })} />) // 101 ∉ short [60,99]
    expect(screen.queryByText(/Within your/)).not.toBeInTheDocument()
    expect(screen.getByText('Why this one')).toBeInTheDocument() // becauseLine still carries the case
  })
  it('omits the whole case section when no honest line exists', () => {
    render(<StagePick {...baseProps({ selected: [], time: 'short' })} />) // no becauseLine, no runtime fit
    expect(screen.queryByText('Why this one')).not.toBeInTheDocument()
  })
  it('renders synopsis when present, hides it when absent', () => {
    const { rerender } = render(<StagePick {...baseProps()} />)
    expect(screen.getByText(/A long enough synopsis for film 1/)).toBeInTheDocument()
    rerender(<StagePick {...baseProps({ results: [film(1, { overview: '' })] })} />)
    expect(screen.queryByText(/A long enough synopsis/)).not.toBeInTheDocument()
  })
  it('renders the provider when available, and stays valid without provider/trailer', () => {
    render(<StagePick {...baseProps({ results: [film(1, { trailerKey: null })] })} />)
    expect(screen.queryByRole('button', { name: /trailer/i })).not.toBeInTheDocument() // no trailer key
    expect(titleHeading('Film1')).toBeInTheDocument() // still valid
  })
})

// ── numeric precision removed ─────────────────────────────────────────────────
describe('StagePick — no numeric match theatre', () => {
  it('shows no Mood fit, no % taste, no percentage ring', () => {
    render(<StagePick {...baseProps()} />)
    expect(screen.queryByText('Mood fit')).not.toBeInTheDocument()
    expect(screen.queryByText(/% taste/)).not.toBeInTheDocument()
    expect(screen.queryByText(/\d+\s*%/)).not.toBeInTheDocument()
  })
  it('still supplies top.match to the impression log as engineScore', () => {
    render(<StagePick {...baseProps()} />)
    expect(logSurfaceImpressions).toHaveBeenCalledWith(expect.objectContaining({
      films: [expect.objectContaining({ id: 1, engineScore: 71 })], // film(1).match = 70 + 1
    }))
  })
})

// ── controlled progression (internal list) ────────────────────────────────────
describe('StagePick — controlled Not tonight / Already watched', () => {
  it('Not tonight promotes the next result (Film2 was not visible before)', async () => {
    render(<StagePick {...baseProps()} />)
    expect(screen.queryByText('Film2')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Not tonight' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Film2' })).toBeInTheDocument()
  })
  it('Already watched promotes the next result after the confirmation hold', async () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Already watched' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Film2' }, { timeout: 2000 })).toBeInTheDocument()
  })
  it('records ONLY the seen top in sessionShownIds (queued films stay unrecorded until promoted)', () => {
    const sessionShownIds = { current: new Set() }
    render(<StagePick {...baseProps({ sessionShownIds })} />)
    expect([...sessionShownIds.current]).toEqual([1]) // only Film1
  })
  it('after Not tonight, sessionShownIds contains Film1 and Film2 only', async () => {
    const sessionShownIds = { current: new Set() }
    render(<StagePick {...baseProps({ sessionShownIds })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Not tonight' }))
    await screen.findByRole('heading', { level: 1, name: 'Film2' })
    expect(sessionShownIds.current.has(1)).toBe(true)
    expect(sessionShownIds.current.has(2)).toBe(true)
    expect(sessionShownIds.current.has(3)).toBe(false) // queued Film3 unrecorded
  })
  it('reaches the exhausted state after the internal results are consumed', async () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Not tonight' })) // Film1 → Film2
    await screen.findByRole('heading', { level: 1, name: 'Film2' })
    fireEvent.click(screen.getByRole('button', { name: 'Not tonight' })) // Film2 → Film3
    await screen.findByRole('heading', { level: 1, name: 'Film3' })
    fireEvent.click(screen.getByRole('button', { name: 'Not tonight' })) // Film3 → exhausted
    expect(await screen.findByText('No more strong fits')).toBeInTheDocument()
  })
})

// ── exhausted state copy ──────────────────────────────────────────────────────
describe('StagePick — exhausted copy', () => {
  it('renders the honest one-pick exhausted language', () => {
    render(<StagePick {...baseProps({ results: [] })} />)
    expect(screen.getByText('No more strong fits')).toBeInTheDocument()
    expect(screen.getByText(/the honest edge of tonight.s list/)).toBeInTheDocument()
    expect(screen.getByText(/Adjust tonight.s details, or start again with a different mood/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adjust tonight' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start over' })).toBeInTheDocument()
  })
})

// ── actions ───────────────────────────────────────────────────────────────────
describe('StagePick — actions', () => {
  it('Open Film File navigates to /movie/{tmdbId} + logs the clicked impression and interaction', () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: /open film file/i }))
    expect(h.navigate).toHaveBeenCalledWith('/movie/101')
    expect(updateImpression).toHaveBeenCalledWith('u1', 1, 'clicked')
    expect(trackInteraction).toHaveBeenCalledWith('click', expect.objectContaining({ movieId: 1, source: 'discover' }))
  })
  it('omits Open Film File when tmdbId is missing', () => {
    render(<StagePick {...baseProps({ results: [film(1, { tmdbId: null })] })} />)
    expect(screen.queryByRole('button', { name: /open film file/i })).not.toBeInTheDocument()
  })
  it('Trailer opens the modal dialog', () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: /trailer/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  it('Save for later writes user_watchlist and cycles the label', async () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save for later' }))
    expect(await screen.findByText('Saved')).toBeInTheDocument()
    expect(h.inserts).toContainEqual({ table: 'user_watchlist', row: { user_id: 'u1', movie_id: 1 } })
    expect(updateImpression).toHaveBeenCalledWith('u1', 1, 'saved')
  })
  it('48-52. Already watched writes user_history with explicit watched_at (ISO) + unchanged ids/source/impression', async () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Already watched' }))
    await screen.findByText('Watched')
    const histInsert = h.inserts.find(i => i.table === 'user_history')
    expect(histInsert).toBeTruthy()
    // 50/51: ids + source unchanged
    expect(histInsert.row).toMatchObject({ user_id: 'u1', movie_id: 1, source: 'discover_marked' })
    // 48/49: watched_at is now written explicitly and is a valid ISO timestamp
    expect(typeof histInsert.row.watched_at).toBe('string')
    expect(new Date(histInsert.row.watched_at).toISOString()).toBe(histInsert.row.watched_at)
    // 52: impression payload unchanged
    expect(updateImpression).toHaveBeenCalledWith('u1', 1, 'watched')
  })
  it('Not tonight flags the skipped impression + logs a dismiss interaction with Stage-2 metadata', () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Not tonight' }))
    expect(updateImpression).toHaveBeenCalledWith('u1', 1, 'skipped')
    expect(trackInteraction).toHaveBeenCalledWith('dismiss', expect.objectContaining({
      movieId: 1, source: 'discover',
      metadata: expect.objectContaining({ action: 'not_tonight', moods: ['tender'], intention: 'move', energy: 'steady', who: 'alone' }),
    }))
  })
  it('the action group has an accessible label + the controls carry the focus/touch classes', () => {
    render(<StagePick {...baseProps()} />)
    const group = screen.getByRole('group', { name: 'Film actions' })
    expect(group).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open film file/i })).toHaveClass('ff-pick-actions__primary')
    expect(screen.getByRole('button', { name: 'Save for later' })).toHaveClass('ff-pick-actions__secondary')
    expect(screen.getByRole('button', { name: 'Not tonight' })).toHaveClass('ff-pick-actions__tertiary')
  })
  it('footer Adjust tonight calls onBack, Start over calls onRestart', () => {
    const p = baseProps()
    render(<StagePick {...p} />)
    fireEvent.click(screen.getByRole('button', { name: 'Adjust tonight' }))
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }))
    expect(p.onBack).toHaveBeenCalledTimes(1)
    expect(p.onRestart).toHaveBeenCalledTimes(1)
  })
})

// ── F3.9: single live-status region ───────────────────────────────────────────
const liveRegion = () => screen.getByRole('status')
describe('StagePick — live status (F3.9)', () => {
  it('exposes exactly one polite, atomic status region', () => {
    render(<StagePick {...baseProps()} />)
    const regions = screen.getAllByRole('status')
    expect(regions).toHaveLength(1)
    expect(regions[0]).toHaveAttribute('aria-live', 'polite')
    expect(regions[0]).toHaveAttribute('aria-atomic', 'true')
  })
  it('announces the first pick with its title', () => {
    render(<StagePick {...baseProps()} />)
    expect(liveRegion()).toHaveTextContent("Tonight's pick: Film1.")
  })
  it('announces save success', async () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save for later' }))
    await waitFor(() => expect(liveRegion()).toHaveTextContent('Saved for later.'))
  })
  it('announces save failure as a retry', async () => {
    h.insertError = { code: '500' }
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save for later' }))
    await waitFor(() => expect(liveRegion()).toHaveTextContent('Could not save. Try again.'))
  })
  it('announces the promoted pick after Not tonight', async () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Not tonight' }))
    await waitFor(() => expect(liveRegion()).toHaveTextContent('New pick: Film2.'))
  })
  it('announces marked-watched then the promoted pick', async () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Already watched' }))
    await waitFor(() => expect(liveRegion()).toHaveTextContent('Marked watched. New pick: Film2.'), { timeout: 2000 })
  })
  it('announces the exhausted state', () => {
    render(<StagePick {...baseProps({ results: [] })} />)
    expect(liveRegion()).toHaveTextContent('No more strong fits for this set of details.')
  })
  it('never announces a queue count', () => {
    render(<StagePick {...baseProps({ results: [film(1), film(2), film(3), film(4), film(5)] })} />)
    expect(liveRegion().textContent).not.toMatch(/\d+\s*(more|queued|left|remaining)/i)
  })
})

// ── F3.9: action-state semantics ──────────────────────────────────────────────
describe('StagePick — action-state semantics (F3.9)', () => {
  it('Save exposes pressed + disabled once saved', async () => {
    render(<StagePick {...baseProps()} />)
    const save = screen.getByRole('button', { name: 'Save for later' })
    expect(save).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(save)
    const saved = await screen.findByRole('button', { name: 'Saved' })
    expect(saved).toHaveAttribute('aria-pressed', 'true')
    expect(saved).toBeDisabled()
  })
  it('Already watched exposes pressed + disabled on success', async () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Already watched' }))
    const done = await screen.findByRole('button', { name: 'Watched' })
    expect(done).toHaveAttribute('aria-pressed', 'true')
    expect(done).toBeDisabled()
  })
  it('Not tonight stays available', () => {
    render(<StagePick {...baseProps()} />)
    expect(screen.getByRole('button', { name: 'Not tonight' })).toBeEnabled()
  })
  it('shows a film-file-unavailable note instead of a dead button when tmdbId is missing', () => {
    render(<StagePick {...baseProps({ results: [film(1, { tmdbId: null })] })} />)
    expect(screen.queryByRole('button', { name: /open film file/i })).not.toBeInTheDocument()
    expect(screen.getByText('Film file unavailable for this title.')).toBeInTheDocument()
  })
  it('all action controls keep accessible names', () => {
    render(<StagePick {...baseProps()} />)
    expect(screen.getByRole('button', { name: /open film file/i })).toBeInTheDocument()
    for (const name of ['Trailer', 'Save for later', 'Already watched', 'Not tonight']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })
})

// ── F3.9: write-error behavior ────────────────────────────────────────────────
describe('StagePick — write-error behavior (F3.9)', () => {
  it('Save treats 23505 (already saved) as success', async () => {
    h.insertError = { code: '23505' }
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save for later' }))
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })
  it('Save surfaces a non-23505 failure as Try again', async () => {
    h.insertError = { code: '500' }
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save for later' }))
    expect(await screen.findByText('Try again')).toBeInTheDocument()
  })
  it('Mark Watched does NOT falsely confirm Watched when the write fails', async () => {
    h.insertError = { code: '500' }
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Already watched' }))
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Watched' })).not.toBeInTheDocument()
    expect(updateImpression).not.toHaveBeenCalledWith('u1', 1, 'watched') // failed write is not credited
    await waitFor(() => expect(liveRegion()).toHaveTextContent('Could not mark watched. Try again.'))
  })
  it('a non-critical impression failure does not block a successful save', async () => {
    updateImpression.mockRejectedValueOnce(new Error('analytics down'))
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save for later' }))
    expect(await screen.findByText('Saved')).toBeInTheDocument() // save still confirms
  })
})

// ── F3.9: streaming-provider honesty ──────────────────────────────────────────
describe('Streaming provider honesty (F3.9)', () => {
  it('StreamingChip renders nothing without a provider (idle/loading)', () => {
    const { container } = render(<StreamingChip provider={null} status="loading" />)
    expect(container).toBeEmptyDOMElement()
  })
  it('StreamingChip maps provider type to the label + a logo alt', () => {
    const { rerender } = render(<StreamingChip provider={{ type: 'flatrate', name: 'Netflix', logoPath: '/n.png' }} status="found" />)
    expect(screen.getByText('Streaming on')).toBeInTheDocument()
    expect(screen.getByAltText('Netflix logo')).toBeInTheDocument()
    rerender(<StreamingChip provider={{ type: 'rent', name: 'Apple TV', logoPath: '/a.png' }} status="found" />)
    expect(screen.getByText('Rent on')).toBeInTheDocument()
    rerender(<StreamingChip provider={{ type: 'buy', name: 'Amazon', logoPath: '/z.png' }} status="found" />)
    expect(screen.getByText('Buy on')).toBeInTheDocument()
  })
  it('StreamingChip renders an honest empty state', () => {
    render(<StreamingChip provider={null} status="empty" />)
    expect(screen.getByText('Availability not found')).toBeInTheDocument()
  })
  it('StreamingChip renders an honest error state', () => {
    render(<StreamingChip provider={null} status="error" />)
    expect(screen.getByText('Availability unavailable')).toBeInTheDocument()
  })
  it('useStreamingProvider keeps flatrate → rent → buy priority (providers[0])', async () => {
    h.providers = [{ type: 'flatrate', name: 'Netflix', logoPath: '/n.png' }, { type: 'rent', name: 'Apple', logoPath: '/a.png' }]
    const { result } = renderHook(() => useStreamingProvider(101))
    await waitFor(() => expect(result.current.status).toBe('found'))
    expect(result.current.provider.type).toBe('flatrate')
  })
  it('useStreamingProvider reports empty when TMDB has no provider', async () => {
    h.providers = []
    const { result } = renderHook(() => useStreamingProvider(101))
    await waitFor(() => expect(result.current.status).toBe('empty'))
  })
  it('useStreamingProvider reports error when the fetch fails', async () => {
    h.providerError = true
    const { result } = renderHook(() => useStreamingProvider(101))
    await waitFor(() => expect(result.current.status).toBe('error'))
  })
  it('StagePick shows the honest no-availability note after an empty fetch', async () => {
    h.providers = []
    render(<StagePick {...baseProps()} />)
    expect(await screen.findByText('Availability not found')).toBeInTheDocument()
  })
})

// ── F3.9: image + decorative semantics ────────────────────────────────────────
describe('StagePick — image + decorative semantics (F3.9)', () => {
  it('the main poster has a meaningful alt', () => {
    render(<StagePick {...baseProps()} />)
    expect(screen.getByAltText('Film1 poster')).toBeInTheDocument()
  })
  it('decorative overlays are aria-hidden', () => {
    const { container } = render(<StagePick {...baseProps()} />)
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0)
  })
  it('button icons are aria-hidden (the text already names the action)', () => {
    render(<StagePick {...baseProps()} />)
    const trailerBtn = screen.getByRole('button', { name: /trailer/i })
    expect(trailerBtn.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})

// ── F3.9: trailer dialog accessibility ────────────────────────────────────────
function TrailerHarness({ title = 'Parasite' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button data-testid="opener" onClick={() => setOpen(true)}>Open trailer</button>
      <TrailerModal open={open} youtubeKey="abc" title={title} onClose={() => setOpen(false)} />
    </>
  )
}
const closeBtn = () => screen.getByRole('button', { name: 'Close trailer' })
describe('TrailerModal — accessibility (F3.9)', () => {
  it('renders nothing when closed', () => {
    render(<TrailerModal open={false} youtubeKey="abc" title="X" onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('is a modal dialog whose name includes the film title', () => {
    render(<TrailerModal open youtubeKey="abc" title="Parasite" onClose={() => {}} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Parasite trailer')
  })
  it('moves initial focus into the dialog (close button)', () => {
    vi.useFakeTimers()
    try {
      render(<TrailerModal open youtubeKey="abc" title="X" onClose={() => {}} />)
      act(() => { vi.advanceTimersByTime(0) })
      expect(closeBtn()).toHaveFocus()
    } finally { vi.useRealTimers() }
  })
  it('Escape closes', () => {
    const onClose = vi.fn()
    render(<TrailerModal open youtubeKey="abc" title="X" onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
  it('overlay click closes, inside click does not', () => {
    const onClose = vi.fn()
    render(<TrailerModal open youtubeKey="abc" title="X" onClose={onClose} />)
    const dialog = screen.getByRole('dialog')
    fireEvent.click(dialog)
    expect(onClose).toHaveBeenCalledTimes(1)
    onClose.mockClear()
    fireEvent.click(dialog.lastElementChild)
    expect(onClose).not.toHaveBeenCalled()
  })
  it('returns focus to the opener on close', () => {
    vi.useFakeTimers()
    try {
      render(<TrailerHarness />)
      const opener = screen.getByTestId('opener')
      opener.focus()
      fireEvent.click(opener)
      act(() => { vi.advanceTimersByTime(0) })
      expect(closeBtn()).toHaveFocus()
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(opener).toHaveFocus()
    } finally { vi.useRealTimers() }
  })
  it('keeps Tab and Shift+Tab inside the dialog', () => {
    vi.useFakeTimers()
    try {
      render(<TrailerModal open youtubeKey="abc" title="X" onClose={() => {}} />)
      act(() => { vi.advanceTimersByTime(0) })
      const btn = closeBtn()
      expect(btn).toHaveFocus()
      fireEvent.keyDown(window, { key: 'Tab' })
      expect(document.activeElement).toBe(btn) // stayed inside
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
      expect(document.activeElement).toBe(btn)
    } finally { vi.useRealTimers() }
  })
  it('locks body scroll while open and restores on unmount', () => {
    const { unmount } = render(<TrailerModal open youtubeKey="abc" title="X" onClose={() => {}} />)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})

// ── existing contracts kept green ─────────────────────────────────────────────
describe('StagePick — write guards', () => {
  it('does not write to the watchlist when there is no user', async () => {
    h.user = null
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save for later' }))
    await Promise.resolve()
    expect(h.inserts).toHaveLength(0)
  })
})

// ── F3.10: fallback data-truth labelling ──────────────────────────────────────
describe('StagePick — fallback data-truth labelling (F3.10)', () => {
  const fb = (reason) => baseProps({ isFallback: true, fallbackReason: reason })
  it('live_error → unavailable-right-now copy', () => {
    render(<StagePick {...fb('live_error')} />)
    expect(screen.getByText('Example pick — live recommendations are unavailable right now.')).toBeInTheDocument()
  })
  it('live_empty → not-ready-yet copy', () => {
    render(<StagePick {...fb('live_empty')} />)
    expect(screen.getByText('Example pick — live recommendations are not ready yet.')).toBeInTheDocument()
  })
  it('filtered_empty → no-strong-fit copy', () => {
    render(<StagePick {...fb('filtered_empty')} />)
    expect(screen.getByText('Example pick — no strong live fit for these details.')).toBeInTheDocument()
  })
  it('unknown reason → generic safe-fallback copy', () => {
    render(<StagePick {...fb('mystery')} />)
    expect(screen.getByText('Example pick — using a safe fallback.')).toBeInTheDocument()
  })
  it('no fallback note when isFallback is false (even with a reason present)', () => {
    render(<StagePick {...baseProps({ isFallback: false, fallbackReason: 'live_error' })} />)
    expect(screen.queryByText(/Example pick/)).not.toBeInTheDocument()
  })
  it('the fallback note is visible + screen-reader reachable (not aria-hidden, no technical wording)', () => {
    render(<StagePick {...fb('live_error')} />)
    const note = screen.getByText('Example pick — live recommendations are unavailable right now.')
    expect(note).toBeVisible()
    expect(note.closest('[aria-hidden="true"]')).toBeNull()
    expect(note.textContent).not.toMatch(/supabase|database|query|api|error code|fetch/i)
  })
  it('fallback mode renders no fabricated authority (no critic/diary/social proof)', () => {
    render(<StagePick {...fb('live_error')} />)
    expect(screen.queryByText(/critics?|reviewers|stars\b|everyone|people are watching|users? love/i)).not.toBeInTheDocument()
  })
  it('actions are unchanged under fallback mode', () => {
    render(<StagePick {...fb('live_error')} />)
    expect(screen.getByRole('button', { name: /open film file/i })).toBeInTheDocument()
    for (const name of ['Trailer', 'Save for later', 'Already watched', 'Not tonight']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })
  it('live status remains the normal pick announcement under fallback mode', () => {
    render(<StagePick {...fb('live_error')} />)
    expect(screen.getByRole('status')).toHaveTextContent("Tonight's pick: Film1.")
  })
})
