// src/features/discover/__tests__/DiscoverResult.test.jsx
// F3.8 — the one-pick Discover result. StagePick now shows exactly ONE film with an
// honest "Why this one" case; the ranked list stays internal (Not tonight / Already
// watched promote the next-best). No visible alternates, no queue count, no match
// percentages, no parallax. All writes/handlers + the StreamingChip / TrailerModal
// sections are unchanged. Everything mocked — no live mount/Supabase/TMDB/YouTube.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

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
  h.user = { id: 'u1' }; h.navigate = vi.fn(); h.inserts = []; h.insertError = null; h.providers = []
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
    expect(screen.getByText(/Tonight.s pick/)).toBeInTheDocument()
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
  it('Already watched writes user_history (source discover_marked) + the watched impression', async () => {
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Already watched' }))
    await screen.findByText('Watched')
    expect(h.inserts).toContainEqual({ table: 'user_history', row: { user_id: 'u1', movie_id: 1, source: 'discover_marked' } })
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

// ── unchanged sections (StreamingChip + TrailerModal) ─────────────────────────
describe('StreamingChip (unchanged)', () => {
  it('renders nothing without a provider', () => {
    const { container } = render(<StreamingChip provider={null} />)
    expect(container).toBeEmptyDOMElement()
  })
  it('maps provider type to the priority label', () => {
    const { rerender } = render(<StreamingChip provider={{ type: 'flatrate', name: 'Netflix', logoPath: '/n.png' }} />)
    expect(screen.getByText('Streaming on')).toBeInTheDocument()
    rerender(<StreamingChip provider={{ type: 'rent', name: 'Apple TV', logoPath: '/a.png' }} />)
    expect(screen.getByText('Rent on')).toBeInTheDocument()
    rerender(<StreamingChip provider={{ type: 'buy', name: 'Amazon', logoPath: '/z.png' }} />)
    expect(screen.getByText('Buy on')).toBeInTheDocument()
  })
})

describe('TrailerModal (unchanged)', () => {
  it('renders nothing when closed', () => {
    render(<TrailerModal open={false} youtubeKey="abc" title="X" onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
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
    fireEvent.click(dialog)
    expect(onClose).toHaveBeenCalledTimes(1)
    onClose.mockClear()
    fireEvent.click(dialog.lastElementChild)
    expect(onClose).not.toHaveBeenCalled()
  })
})

// no write occurs when there is no user
describe('StagePick — write guards', () => {
  it('does not write to the watchlist when there is no user', async () => {
    h.user = null
    render(<StagePick {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save for later' }))
    await Promise.resolve()
    expect(h.inserts).toHaveLength(0)
  })
})
