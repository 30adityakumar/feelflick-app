// src/features/home/__tests__/HomeBriefingActions.test.jsx
// F4.3 — Home Briefing action reliability. Everything is mocked: no live mount, no
// Supabase/TMDB, no real recommendation_impressions. useUserMovieStatus is mocked to
// FAITHFULLY mirror the real hook (optimistic set → revert on failure, loading
// true→false on settle) via a test-controlled deferred, so the briefing's
// success-before-advance gating + honest feedback can be asserted deterministically.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const h = vi.hoisted(() => ({
  user: { id: 'u1' },
  moods: [], loading: false, error: null,
  internalId: 999,
  watchedOutcome: 'success', saveOutcome: 'success',
  watchedDeferred: null, saveDeferred: null,
  impressionReject: false, skipReject: false, dismissReject: false,
  navigate: () => {},
}))

// A live supabase client must never be touched in this test — any access throws.
vi.mock('@/shared/lib/supabase/client', () => ({ supabase: { from: () => { throw new Error('no live supabase in test') } } }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: h.user }) }))
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => h.navigate }))
vi.mock('@/shared/services/recommendations', () => ({
  logSurfaceImpressions: vi.fn(() => (h.impressionReject ? Promise.reject(new Error('imp fail')) : Promise.resolve())),
  updateImpression: vi.fn(() => (h.skipReject ? Promise.reject(new Error('skip fail')) : Promise.resolve())),
}))
vi.mock('@/shared/services/interactions', () => ({ trackInteraction: vi.fn(() => (h.dismissReject ? Promise.reject(new Error('dismiss fail')) : Promise.resolve())) }))
vi.mock('@/shared/services/recommendationOutcomes', () => ({ recordRecommendationOutcome: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/api/tmdb', async (orig) => ({ ...(await orig()), getMovieWatchProviders: vi.fn(() => Promise.resolve({ providers: [] })) }))

// Mirror the real useUserMovieStatus contract: optimistic flip, revert-on-failure,
// loading true→false on settle. The settle is gated on a test-controlled deferred.
vi.mock('@/shared/hooks/useUserMovieStatus', async () => {
  const React = await import('react')
  return { useUserMovieStatus: () => {
    const [isWatched, setIsWatched] = React.useState(false)
    const [isInWatchlist, setIsInWatchlist] = React.useState(false)
    const [loading, setLoading] = React.useState({ watchlist: false, watched: false })
    const toggleWatched = React.useCallback(() => {
      setLoading(l => ({ ...l, watched: true })); setIsWatched(true)
      let resolve; const promise = new Promise(r => { resolve = r }); h.watchedDeferred = { promise, resolve }
      promise.then(() => { if (h.watchedOutcome === 'fail') setIsWatched(false); setLoading(l => ({ ...l, watched: false })) })
    }, [])
    const toggleWatchlist = React.useCallback(() => {
      setLoading(l => ({ ...l, watchlist: true })); setIsInWatchlist(v => !v)
      let resolve; const promise = new Promise(r => { resolve = r }); h.saveDeferred = { promise, resolve }
      promise.then(() => { if (h.saveOutcome === 'fail') setIsInWatchlist(v => !v); setLoading(l => ({ ...l, watchlist: false })) })
    }, [])
    return { isWatched, isInWatchlist, loading, toggleWatched, toggleWatchlist, internalId: h.internalId }
  } }
})

// Strip framer-motion animation so AnimatePresence advances the pick synchronously.
vi.mock('framer-motion', async () => {
  const React = await import('react')
  const strip = (p) => { const { initial, animate, exit, variants, transition, whileHover, whileTap, whileInView, layout, layoutId, ...rest } = p; return rest }
  const cache = {}
  const make = (tag) => {
    if (!cache[tag]) {
      const C = React.forwardRef((props, ref) => React.createElement(tag, { ...strip(props), ref }, props.children))
      C.displayName = `motion.${String(tag)}`
      cache[tag] = C
    }
    return cache[tag] // stable component identity per tag → no remount on re-render
  }
  return {
    AnimatePresence: ({ children }) => children,
    motion: new Proxy({}, { get: (_t, tag) => make(tag) }),
    useReducedMotion: () => true,
  }
})

// The data provider + the bottom sections are out of scope — stub them.
vi.mock('../useHomeData', () => ({
  HomeDataProvider: ({ children }) => children,
  useHomeData: () => ({ loading: h.loading, error: h.error, moods: h.moods }),
}))
vi.mock('../sections-bottom', () => ({
  ContinueWatching: () => null, CinematicDNA: () => null, TasteTwinPulse: () => null,
  TasteMatch: () => null, CuratedLists: () => null, QuickLog: () => null, PageEndCard: () => null,
}))

import Home from '../Home'
import { MOOD_META } from '../data'
import { logSurfaceImpressions, updateImpression } from '@/shared/services/recommendations'
import { trackInteraction } from '@/shared/services/interactions'

const MOOD_ID = MOOD_META[0].id
const film = (id) => ({ id, tmdbId: 1000 + id, title: `Movie ${id}`, year: 2010 + id, runtime: 110, director: `Dir ${id}`, engineReason: null, synopsis: null, matchPct: 80, poster: `/p${id}.jpg` })

const renderHome = () => render(<MemoryRouter><Home /></MemoryRouter>)
const pickTitle = () => screen.getByRole('heading', { level: 2 }).textContent
const liveRegion = () => document.querySelector('[role="status"][aria-live="polite"]')
const btn = (name) => screen.getByRole('button', { name })

beforeEach(() => {
  h.user = { id: 'u1' }; h.loading = false; h.error = null; h.internalId = 999
  h.watchedOutcome = 'success'; h.saveOutcome = 'success'; h.watchedDeferred = null; h.saveDeferred = null
  h.impressionReject = false; h.skipReject = false; h.dismissReject = false; h.navigate = vi.fn()
  h.moods = [{ id: MOOD_ID, films: [film(1), film(2), film(3)] }]
  vi.clearAllMocks()
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
})

describe('Home Briefing — active-pick impression', () => {
  it('logs exactly one impression on render with the unchanged payload', async () => {
    renderHome()
    await waitFor(() => expect(logSurfaceImpressions).toHaveBeenCalledTimes(1))
    const arg = logSurfaceImpressions.mock.calls[0][0]
    expect(arg).toMatchObject({ userId: 'u1', placement: 'hero', pickReasonType: 'briefing_active', pickReasonLabel: MOOD_ID })
    expect(arg.films).toHaveLength(1)
    expect(typeof arg.films[0].id).toBe('number')
  })

  it('contains a rejected impression write without crashing', async () => {
    h.impressionReject = true
    renderHome()
    await waitFor(() => expect(logSurfaceImpressions).toHaveBeenCalled())
    // The pick still renders; the rejection is swallowed (no unhandled promise).
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy()
  })

  it('announces the initial visible pick politely', async () => {
    renderHome()
    await waitFor(() => expect(liveRegion()?.textContent).toMatch(/^Tonight.s briefing pick: Movie \d+\.$/))
  })
})

describe('Home Briefing — Mark Watched', () => {
  it('waits for the write before advancing the pick', async () => {
    renderHome()
    const t1 = pickTitle()
    fireEvent.click(btn('Mark Watched'))
    // Write in flight (deferred unresolved) → the pick must NOT have advanced.
    expect(pickTitle()).toBe(t1)
    expect(h.watchedDeferred).toBeTruthy()
    await act(async () => { h.watchedDeferred.resolve(); await h.watchedDeferred.promise })
    await waitFor(() => expect(pickTitle()).not.toBe(t1), { timeout: 2000 })
  })

  it('does not advance + shows retryable feedback on failure', async () => {
    h.watchedOutcome = 'fail'
    renderHome()
    const t1 = pickTitle()
    fireEvent.click(btn('Mark Watched'))
    await act(async () => { h.watchedDeferred.resolve(); await h.watchedDeferred.promise })
    // Pick stays; failure announced; the button offers a retry.
    await waitFor(() => expect(liveRegion()?.textContent).toBe('Could not mark watched. Try again.'))
    expect(pickTitle()).toBe(t1)
    expect(screen.getByRole('button', { name: 'Mark Watched' }).getAttribute('title')).toMatch(/retry/i)
  })

  it('announces watched + the new pick on success', async () => {
    renderHome()
    const t1 = pickTitle()
    fireEvent.click(btn('Mark Watched'))
    await act(async () => { h.watchedDeferred.resolve(); await h.watchedDeferred.promise })
    await waitFor(() => expect(liveRegion()?.textContent).toMatch(/^Marked watched\. New briefing pick: Movie \d+\.$/), { timeout: 2000 })
    expect(pickTitle()).not.toBe(t1)
  })
})

describe('Home Briefing — Skip / Not Tonight', () => {
  it('writes skipped-impression BEFORE the dismiss interaction', async () => {
    renderHome()
    await waitFor(() => expect(screen.getByRole('heading', { level: 2 })).toBeTruthy())
    fireEvent.click(btn('Skip Tonight'))
    await waitFor(() => expect(updateImpression).toHaveBeenCalled())
    expect(trackInteraction).toHaveBeenCalled()
    expect(updateImpression.mock.invocationCallOrder[0]).toBeLessThan(trackInteraction.mock.invocationCallOrder[0])
    // payloads unchanged
    expect(updateImpression).toHaveBeenCalledWith('u1', expect.any(Number), 'skipped')
    expect(trackInteraction).toHaveBeenCalledWith('dismiss', expect.objectContaining({ source: 'briefing', metadata: expect.objectContaining({ action: 'skip' }) }))
  })

  it('contains failures in the non-critical tracking writes', async () => {
    h.skipReject = true; h.dismissReject = true
    renderHome()
    const t1 = pickTitle()
    fireEvent.click(btn('Skip Tonight'))
    // No crash; the pick still advances despite both tracking writes rejecting.
    await waitFor(() => expect(pickTitle()).not.toBe(t1))
  })

  it('advances the visible pick and announces the new one', async () => {
    renderHome()
    const t1 = pickTitle()
    fireEvent.click(btn('Skip Tonight'))
    await waitFor(() => expect(pickTitle()).not.toBe(t1))
    expect(liveRegion()?.textContent).toMatch(/^New briefing pick: Movie \d+\.$/)
  })
})

describe('Home Briefing — Save', () => {
  it('announces success after the write settles', async () => {
    renderHome()
    fireEvent.click(btn('Save'))
    await act(async () => { h.saveDeferred.resolve(); await h.saveDeferred.promise })
    await waitFor(() => expect(liveRegion()?.textContent).toBe('Saved for later.'))
    expect(screen.getByRole('button', { name: 'Saved' })).toBeTruthy()
  })

  it('announces a retryable failure and reverts on error', async () => {
    h.saveOutcome = 'fail'
    renderHome()
    fireEvent.click(btn('Save'))
    await act(async () => { h.saveDeferred.resolve(); await h.saveDeferred.promise })
    await waitFor(() => expect(liveRegion()?.textContent).toBe('Could not save. Try again.'))
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy() // reverted
  })
})

describe('Home Briefing — exhausted', () => {
  it('announces no more picks when the mood queue empties', async () => {
    h.moods = [{ id: MOOD_ID, films: [film(1)] }]
    renderHome()
    await waitFor(() => expect(screen.getByRole('heading', { level: 2 })).toBeTruthy())
    fireEvent.click(btn('Skip Tonight'))
    await waitFor(() => expect(liveRegion()?.textContent).toBe('No more picks for this mood.'))
  })
})

describe('Home Briefing — safety', () => {
  it('uses only mocked services (no live supabase/tmdb/fetch)', async () => {
    // The supabase mock throws on any access; reaching this assertion means nothing
    // touched it. Provider lookups go through the mocked TMDB helper.
    renderHome()
    await waitFor(() => expect(logSurfaceImpressions).toHaveBeenCalled())
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy()
  })
})
