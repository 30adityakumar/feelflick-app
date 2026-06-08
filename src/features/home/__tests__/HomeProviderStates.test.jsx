// src/features/home/__tests__/HomeProviderStates.test.jsx
// F4.6 — honest provider states on the Briefing. Renders Home (desktop provider
// markup is in the DOM under jsdom) with a controllable getMovieWatchProviders
// mock. No live TMDB/Supabase/impression writes.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const h = vi.hoisted(() => ({
  user: { id: 'u1' }, moods: [], navigate: () => {},
  providerMode: 'found',
  providers: [{ name: 'Mock Stream', logoPath: '/ms.png', type: 'flatrate' }],
  providerOpts: null,
}))

vi.mock('@/shared/lib/supabase/client', () => ({ supabase: { from: () => { throw new Error('no live supabase in test') } } }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: h.user }) }))
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => h.navigate }))
vi.mock('@/shared/services/recommendations', () => ({ logSurfaceImpressions: vi.fn(() => Promise.resolve()), updateImpression: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/services/interactions', () => ({ trackInteraction: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/services/recommendationOutcomes', () => ({ recordRecommendationOutcome: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/hooks/useUserMovieStatus', () => ({
  useUserMovieStatus: () => ({ isWatched: false, isInWatchlist: false, loading: { watchlist: false, watched: false }, toggleWatched: () => {}, toggleWatchlist: () => {}, internalId: 1 }),
}))
vi.mock('@/shared/api/tmdb', async (orig) => ({
  ...(await orig()),
  getMovieWatchProviders: vi.fn((id, opts) => {
    h.providerOpts = opts
    switch (h.providerMode) {
      case 'found': return Promise.resolve({ providers: h.providers })
      case 'empty': return Promise.resolve({ providers: [] })
      case 'error': return Promise.reject(new Error('tmdb down'))
      case 'abort': return Promise.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
      case 'loading': return new Promise(() => {}) // never settles
      default: return Promise.resolve({ providers: [] })
    }
  }),
}))
vi.mock('framer-motion', async () => {
  const React = await import('react')
  const cache = {}
  const strip = (p) => { const { initial, animate, exit, variants, transition, whileHover, whileTap, whileInView, layout, layoutId, ...rest } = p; return rest }
  const make = (tag) => { if (!cache[tag]) { const C = React.forwardRef((props, ref) => React.createElement(tag, { ...strip(props), ref }, props.children)); C.displayName = `motion.${String(tag)}`; cache[tag] = C } return cache[tag] }
  return { AnimatePresence: ({ children }) => children, motion: new Proxy({}, { get: (_t, tag) => make(tag) }), useReducedMotion: () => true }
})
vi.mock('../useHomeData', () => ({
  HomeDataProvider: ({ children }) => children,
  useHomeData: () => ({ loading: false, error: null, moods: h.moods, seenCandidates: [], continueItem: null, dna: null, friends: [], lists: [], twinPulse: [] }),
}))
vi.mock('../sections-bottom', () => ({
  ContinueWatching: () => null, CinematicDNA: () => null, TasteTwinPulse: () => null,
  TasteMatch: () => null, CuratedLists: () => null, QuickLog: () => null, PageEndCard: () => null,
}))

import Home from '../Home'
import { MOOD_META } from '../data'

const MOOD_ID = MOOD_META[0].id
const renderHome = () => render(<MemoryRouter><Home /></MemoryRouter>)

beforeEach(() => {
  h.user = { id: 'u1' }; h.navigate = vi.fn(); h.providerMode = 'found'; h.providerOpts = null
  h.providers = [{ name: 'Mock Stream', logoPath: '/ms.png', type: 'flatrate' }]
  h.moods = [{ id: MOOD_ID, films: [{ id: 1, tmdbId: 555, title: 'Movie 1', year: 2011, runtime: 110, director: 'Dir 1', engineReason: null, synopsis: null, poster: '/p1.jpg' }] }]
  vi.clearAllMocks()
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
})

describe('Briefing provider states (F4.6)', () => {
  it('FOUND: renders the provider chip with the first provider', async () => {
    h.providers = [{ name: 'First Co', logoPath: '/f.png', type: 'flatrate' }, { name: 'Second Co', logoPath: '/s.png', type: 'rent' }]
    renderHome()
    await waitFor(() => expect(screen.getByText('First Co')).toBeTruthy()) // providers[0]
    expect(screen.queryByText('Second Co')).toBeNull()
    expect(screen.queryByText(/Availability/)).toBeNull()
  })

  it('FOUND: the logo alt includes "logo"', async () => {
    renderHome()
    await waitFor(() => expect(screen.getByAltText('Mock Stream logo')).toBeTruthy())
  })

  it('passes the unchanged CA → US request options with an abort signal', async () => {
    renderHome()
    await waitFor(() => expect(h.providerOpts).toBeTruthy())
    expect(h.providerOpts.region).toBe('CA')
    expect(h.providerOpts.fallbackRegion).toBe('US')
    expect(h.providerOpts.signal).toBeInstanceOf(AbortSignal)
  })

  it('LOADING: renders no provider copy (no layout shift)', async () => {
    h.providerMode = 'loading'
    renderHome()
    await waitFor(() => expect(screen.getByRole('heading', { level: 2 })).toBeTruthy())
    expect(screen.queryByText(/Availability/)).toBeNull()
    expect(screen.queryByText('Mock Stream')).toBeNull()
  })

  it('EMPTY: renders "Availability not found"', async () => {
    h.providerMode = 'empty'
    renderHome()
    await waitFor(() => expect(screen.getByText('Availability not found')).toBeTruthy())
    expect(screen.queryByText('Availability unavailable')).toBeNull()
  })

  it('ERROR: renders "Availability unavailable"', async () => {
    h.providerMode = 'error'
    renderHome()
    await waitFor(() => expect(screen.getByText('Availability unavailable')).toBeTruthy())
    expect(screen.queryByText('Availability not found')).toBeNull()
  })

  it('ABORT: an aborted/stale request does NOT show an error', async () => {
    h.providerMode = 'abort'
    renderHome()
    await waitFor(() => expect(screen.getByRole('heading', { level: 2 })).toBeTruthy())
    // give the rejected promise a tick to flush
    await new Promise(r => setTimeout(r, 0))
    expect(screen.queryByText('Availability unavailable')).toBeNull()
    expect(screen.queryByText('Availability not found')).toBeNull()
  })
})
