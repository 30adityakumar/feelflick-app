// src/features/discover/__tests__/DiscoverEntry.test.jsx
// F3.5 + F3.6 — the Discover shell. F3.5: opens on the mood front door; onboarding
// seeds all mapped moods (deduped, ≤3); direct visits start empty. F3.6: Mood
// Continue lands on the summary-first night-context checkpoint; the primary CTA is
// available immediately; preferences are written ONLY when the user explicitly
// continues; predictions recompute on mood change but never overwrite a manual
// edit; Tweak Inputs / Start Over behave correctly. Real Discover, mocked data +
// writes — no live fetch, no impression/watchlist/history writes.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const h = vi.hoisted(() => ({
  baselineMoods: [], profile: { affinities: { directors: [] } }, learnedPrefs: null,
  upserts: [], inserts: [], reduced: false, dataSource: { movies: 'live', reason: 'live_ok' },
}))

// Keep real motion/AnimatePresence; control useReducedMotion via h.reduced.
vi.mock('framer-motion', async (orig) => ({ ...(await orig()), useReducedMotion: () => h.reduced }))
vi.mock('../useDiscoverData', () => ({
  DiscoverDataProvider: ({ children }) => children,
  useDiscoverData: () => ({ films: [], profile: h.profile, baselineMoods: h.baselineMoods, learnedPrefs: h.learnedPrefs, recentSaves: [], dataSource: h.dataSource }),
}))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: { id: 'u1' } }) }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    from: (table) => ({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }),
      upsert: (row, opts) => { h.upserts.push({ table, row, opts }); return Promise.resolve({ error: null }) },
      insert: (row) => { h.inserts.push({ table, row }); return Promise.resolve({ error: null }) },
      delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }),
    }),
  },
}))
// Stage-3 services — kept inert so the exhausted result page mounts without writes.
vi.mock('@/shared/services/recommendations', () => ({ scoreMovieForUser: vi.fn(), updateImpression: vi.fn().mockResolvedValue(), logSurfaceImpressions: vi.fn().mockResolvedValue() }))
vi.mock('@/shared/services/matchScore', () => ({ computeMatchPercent: vi.fn() }))
vi.mock('@/shared/services/interactions', () => ({ trackInteraction: vi.fn().mockResolvedValue() }))
vi.mock('@/shared/api/tmdb', () => ({ getMovieWatchProviders: vi.fn(() => Promise.resolve({ providers: [] })) }))

import Discover from '../Discover'
import { updateImpression, logSurfaceImpressions } from '@/shared/services/recommendations'
import { trackInteraction } from '@/shared/services/interactions'
import { RESOLVE_DURATION_MS } from '../sections/StageResolve'

const renderDiscover = ({ fromOnboarding = false } = {}) => {
  const entries = fromOnboarding ? [{ pathname: '/discover', state: { fromOnboarding: true } }] : ['/discover']
  return render(<MemoryRouter initialEntries={entries}><Discover /></MemoryRouter>)
}
const moodBtn = (label) => screen.getByText(label, { selector: '.ff-mood-label' }).closest('button')
const pressedCount = () => screen.getAllByRole('button').filter(b => b.getAttribute('aria-pressed') === 'true').length
const continueBtn = () => screen.getByRole('button', { name: /continue/i })
const findFilmBtn = () => screen.getByRole('button', { name: /find my film/i })
const prefUpserts = () => h.upserts.filter(u => u.table === 'user_discover_preferences')
const nightHeading = () => screen.queryByRole('heading', { level: 1, name: 'A few details, already filled in.' })
const gotoNight = (mood = 'Cozy') => { fireEvent.click(moodBtn(mood)); fireEvent.click(continueBtn()) }

beforeEach(() => {
  h.baselineMoods = []; h.profile = { affinities: { directors: [] } }; h.learnedPrefs = null
  h.upserts = []; h.inserts = []; h.reduced = false; h.dataSource = { movies: 'live', reason: 'live_ok' }
  vi.clearAllMocks()
  window.matchMedia = vi.fn().mockImplementation((q) => ({
    matches: false, media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
})

// ── F3.5: mood front door + handoff ───────────────────────────────────────────
describe('Discover entry — mood front door (F3.5)', () => {
  it('opens directly on StageMood (no StageHero launch screen)', () => {
    renderDiscover()
    expect(screen.getByRole('heading', { name: /shape.*of your mood/i })).toBeInTheDocument()
    expect(screen.queryByText(/How do you feel\?/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /surprise me/i })).not.toBeInTheDocument()
  })
  it('an ordinary visit starts with NO mood selected', () => {
    renderDiscover()
    expect(pressedCount()).toBe(0)
    expect(continueBtn()).toBeDisabled()
  })
  it('seeds all mapped baseline moods (deduped, ≤3, order-preserved)', async () => {
    h.baselineMoods = ['tender', 'cozy', 'cozy', 'wired', 'fun'] // → tender, cozy, cerebral (cap 3)
    renderDiscover({ fromOnboarding: true })
    await waitFor(() => expect(pressedCount()).toBe(3))
    expect(within(moodBtn('Tender')).getByText('1')).toBeInTheDocument()
    expect(within(moodBtn('Cozy')).getByText('2')).toBeInTheDocument()
    expect(moodBtn('Cerebral')).toHaveAttribute('aria-pressed', 'true')
  })
})

// ── F3.6: the night-context checkpoint ────────────────────────────────────────
describe('Discover night context — summary-first (F3.6)', () => {
  it('Mood Continue opens the night-context summary with the CTA immediately + no four taps', () => {
    renderDiscover()
    gotoNight('Cozy')
    expect(nightHeading()).toBeInTheDocument()
    expect(findFilmBtn()).toBeInTheDocument()           // primary CTA available immediately
    expect(screen.queryByRole('group')).not.toBeInTheDocument() // no required editor
    expect(screen.queryByText(/1 of 4|Tap any option to confirm|Show me my edition/)).not.toBeInTheDocument()
  })
  it('the summary shows the predicted default values', () => {
    renderDiscover()
    gotoNight('Cozy') // cozy → intention "comfort"; no avgRuntime → time "std"; who "alone"
    expect(screen.getByText('Comfort me')).toBeInTheDocument()
    expect(screen.getByText('~ 2 hrs')).toBeInTheDocument()
    expect(screen.getByText('Alone')).toBeInTheDocument()
  })

  it('writes NO preference on mount, Mood-Continue, opening details, or changing an option', () => {
    renderDiscover()
    expect(prefUpserts()).toHaveLength(0)        // mount
    gotoNight('Cozy')
    expect(prefUpserts()).toHaveLength(0)        // after Mood Continue
    fireEvent.click(screen.getByRole('button', { name: /adjust details/i }))
    expect(prefUpserts()).toHaveLength(0)        // after opening details
    fireEvent.click(screen.getByRole('button', { name: /Make me think/ }))
    expect(prefUpserts()).toHaveLength(0)        // after changing an option
  })

  it('Find my film commits the preference upsert ONCE and enters StageResolve (not the old ceremony)', async () => {
    vi.useFakeTimers()
    try {
      renderDiscover()
      gotoNight('Cozy')
      fireEvent.click(findFilmBtn())
      expect(screen.getByText('Bringing tonight into focus.')).toBeInTheDocument() // StageResolve
      expect(screen.queryByText(/Take a breath|The room is yours|Reading the room/)).not.toBeInTheDocument() // old ceremony gone
      await act(async () => { await vi.advanceTimersByTimeAsync(0) }) // flush the fire-and-forget commit (resolve timer not yet)
      expect(prefUpserts()).toHaveLength(1)
      expect(prefUpserts()[0].row).toMatchObject({ user_id: 'u1' })
    } finally { vi.useRealTimers() }
  })

  it('Find my film writes exactly one preference upsert with the full count payload (onConflict user_id)', async () => {
    vi.useFakeTimers()
    try {
      renderDiscover()
      gotoNight('Cozy') // predicted: intention=comfort, time=std, who=alone, energy=hour-based
      fireEvent.click(findFilmBtn())
      await act(async () => { await vi.advanceTimersByTimeAsync(0) }) // flush the fire-and-forget commit
      const ups = prefUpserts()
      expect(ups).toHaveLength(1)
      expect(ups[0].opts).toEqual({ onConflict: 'user_id' })
      const row = ups[0].row
      expect(row.user_id).toBe('u1')
      expect(row.total_commits).toBe(1)
      // existing row is null → each count map starts at the accepted value with count 1
      expect(row.intention_counts).toEqual({ comfort: 1 }) // cozy → comfort
      expect(row.time_counts).toEqual({ std: 1 })
      expect(row.who_counts).toEqual({ alone: 1 })
      expect(Object.values(row.energy_counts)).toEqual([1]) // hour-dependent key, count 1
    } finally { vi.useRealTimers() }
  })

  it('the result appears after exactly 900ms — not before', async () => {
    vi.useFakeTimers()
    try {
      renderDiscover()
      gotoNight('Cozy')
      fireEvent.click(findFilmBtn())
      await act(async () => { await vi.advanceTimersByTimeAsync(899) })
      expect(screen.getByText('Bringing tonight into focus.')).toBeInTheDocument() // still resolving
      expect(screen.queryByRole('button', { name: 'Not tonight' })).not.toBeInTheDocument()
      await act(async () => { await vi.advanceTimersByTimeAsync(1) })
      expect(screen.getByRole('button', { name: 'Not tonight' })).toBeInTheDocument() // StagePick reached
    } finally { vi.useRealTimers() }
  })

  it('under reduced motion the result appears without the long ceremony wait', async () => {
    h.reduced = true
    vi.useFakeTimers()
    try {
      renderDiscover()
      gotoNight('Cozy')
      fireEvent.click(findFilmBtn())
      await act(async () => { await vi.advanceTimersByTimeAsync(0) }) // 0ms resolve under reduced motion
      expect(screen.getByRole('button', { name: 'Not tonight' })).toBeInTheDocument()
    } finally { vi.useRealTimers() }
  })

  it('Back from the night context returns to MoodStage', () => {
    renderDiscover()
    gotoNight('Cozy')
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByRole('heading', { name: /shape.*of your mood/i })).toBeInTheDocument()
  })

  it('no impression / watchlist / history / interaction write occurs in the flow', () => {
    renderDiscover()
    gotoNight('Cozy')
    fireEvent.click(screen.getByRole('button', { name: /adjust details/i }))
    fireEvent.click(screen.getByRole('button', { name: /Make me laugh/ }))
    expect(updateImpression).not.toHaveBeenCalled()
    expect(logSurfaceImpressions).not.toHaveBeenCalled()
    expect(trackInteraction).not.toHaveBeenCalled()
    expect(h.inserts).toHaveLength(0)
  })
})

// ── F3.6: prediction vs manual edit ───────────────────────────────────────────
describe('Discover night context — prediction + edit protection (F3.6)', () => {
  it('a mood change recomputes the defaults BEFORE any manual edit', () => {
    renderDiscover()
    gotoNight('Cozy')
    expect(screen.getByText('Comfort me')).toBeInTheDocument() // cozy → comfort
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    fireEvent.click(moodBtn('Cozy'))     // deselect cozy
    fireEvent.click(moodBtn('Cerebral')) // select cerebral → predicts "think"
    fireEvent.click(continueBtn())
    expect(screen.getByText('Make me think')).toBeInTheDocument() // recomputed
  })

  it('a manual edit is NOT overwritten by a later mood/default update', () => {
    renderDiscover()
    gotoNight('Cozy')
    fireEvent.click(screen.getByRole('button', { name: /adjust details/i }))
    fireEvent.click(screen.getByRole('button', { name: /Make me laugh/ })) // manual edit → intention 'laugh'
    fireEvent.click(screen.getByRole('button', { name: /done adjusting/i }))
    expect(screen.getByText('Make me laugh')).toBeInTheDocument()
    // change moods — prediction must NOT overwrite the manual edit
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    fireEvent.click(moodBtn('Cozy'))
    fireEvent.click(moodBtn('Cerebral'))
    fireEvent.click(continueBtn())
    expect(screen.getByText('Make me laugh')).toBeInTheDocument() // frozen
    expect(screen.queryByText('Make me think')).not.toBeInTheDocument()
  })
})

// ── F3.6/F3.7: Tweak Inputs + Start Over (reach the result via the 900ms resolve)
describe('Discover night context — Tweak Inputs + Start Over (F3.6/F3.7)', () => {
  const advanceResolve = async () => {
    await act(async () => { await vi.advanceTimersByTimeAsync(RESOLVE_DURATION_MS) }) // StageResolve → StagePick
  }
  it('Adjust tonight (result footer) returns to the summary with context preserved', async () => {
    vi.useFakeTimers()
    try {
      renderDiscover()
      gotoNight('Cozy')
      fireEvent.click(findFilmBtn())
      await advanceResolve()
      fireEvent.click(screen.getByRole('button', { name: /adjust tonight/i })) // StagePick footer (was "Tweak inputs")
      expect(nightHeading()).toBeInTheDocument()
      expect(screen.getByText('Comfort me')).toBeInTheDocument() // cozy→comfort survives Tweak
    } finally { vi.useRealTimers() }
  })

  it('Start Over returns to MoodStage, clears moods, and does not reapply the onboarding seed', async () => {
    vi.useFakeTimers()
    try {
      h.baselineMoods = ['cozy']
      renderDiscover({ fromOnboarding: true })
      await vi.advanceTimersByTimeAsync(0) // let the seed effect run
      fireEvent.click(continueBtn())       // seeded cozy → night
      fireEvent.click(findFilmBtn())
      await advanceResolve()
      fireEvent.click(screen.getByRole('button', { name: /start over/i }))
      expect(screen.getByRole('heading', { name: /shape.*of your mood/i })).toBeInTheDocument()
      expect(pressedCount()).toBe(0) // moods cleared, seed NOT reapplied
    } finally { vi.useRealTimers() }
  })
})

// ── F3.10: fallback data-source threading (shell → StagePick) ─────────────────
describe('Discover shell — fallback data-source threading (F3.10)', () => {
  const gotoResult = async (mood = 'Cozy') => {
    gotoNight(mood)
    fireEvent.click(findFilmBtn())
    await act(async () => { await vi.advanceTimersByTimeAsync(RESOLVE_DURATION_MS) }) // StageResolve → StagePick
  }
  it('live_ok → no fallback note (NOT inferred from the empty films array)', async () => {
    vi.useFakeTimers()
    try {
      h.dataSource = { movies: 'live', reason: 'live_ok' }
      renderDiscover()
      await gotoResult()
      expect(screen.queryByText(/Example pick/)).not.toBeInTheDocument()
    } finally { vi.useRealTimers() }
  })
  it('live_error → "live recommendations are unavailable right now."', async () => {
    vi.useFakeTimers()
    try {
      h.dataSource = { movies: 'fallback', reason: 'live_error', errorMessage: 'x' }
      renderDiscover()
      await gotoResult()
      expect(screen.getByText('Example pick — live recommendations are unavailable right now.')).toBeInTheDocument()
    } finally { vi.useRealTimers() }
  })
  it('live_empty → "live recommendations are not ready yet."', async () => {
    vi.useFakeTimers()
    try {
      h.dataSource = { movies: 'fallback', reason: 'live_empty' }
      renderDiscover()
      await gotoResult()
      expect(screen.getByText('Example pick — live recommendations are not ready yet.')).toBeInTheDocument()
    } finally { vi.useRealTimers() }
  })
  it('filtered_empty → "no strong live fit for these details."', async () => {
    vi.useFakeTimers()
    try {
      h.dataSource = { movies: 'fallback', reason: 'filtered_empty' }
      renderDiscover()
      await gotoResult()
      expect(screen.getByText('Example pick — no strong live fit for these details.')).toBeInTheDocument()
    } finally { vi.useRealTimers() }
  })
  it('reaching a fallback result triggers no impression/watchlist/history/interaction writes', async () => {
    vi.useFakeTimers()
    try {
      h.dataSource = { movies: 'fallback', reason: 'live_error' }
      renderDiscover()
      await gotoResult()
      expect(screen.getByText(/Example pick/)).toBeInTheDocument()
      // The single preference upsert is the normal explicit "Find my film" accept;
      // fallback mode adds no watchlist/history/interaction writes.
      expect(h.inserts).toHaveLength(0)
      expect(updateImpression).not.toHaveBeenCalled()
      expect(trackInteraction).not.toHaveBeenCalled()
    } finally { vi.useRealTimers() }
  })
})
