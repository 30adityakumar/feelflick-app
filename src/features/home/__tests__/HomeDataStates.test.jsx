// src/features/home/__tests__/HomeDataStates.test.jsx
// F4.3 — Home top-level data states. The data provider is mocked so we control
// loading / error / loaded without any live Supabase read. Everything else is
// stubbed; no live services, no recommendation_impressions.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const h = vi.hoisted(() => ({ user: { id: 'u1' }, moods: [], loading: false, error: null, navigate: () => {} }))

vi.mock('@/shared/lib/supabase/client', () => ({ supabase: { from: () => { throw new Error('no live supabase in test') } } }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: h.user }) }))
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => h.navigate }))
vi.mock('@/shared/services/recommendations', () => ({ logSurfaceImpressions: vi.fn(() => Promise.resolve()), updateImpression: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/services/interactions', () => ({ trackInteraction: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/services/recommendationOutcomes', () => ({ recordRecommendationOutcome: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/api/tmdb', async (orig) => ({ ...(await orig()), getMovieWatchProviders: vi.fn(() => Promise.resolve({ providers: [] })) }))
vi.mock('@/shared/hooks/useUserMovieStatus', () => ({
  useUserMovieStatus: () => ({ isWatched: false, isInWatchlist: false, loading: { watchlist: false, watched: false }, toggleWatched: () => {}, toggleWatchlist: () => {}, internalId: 1 }),
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
  useHomeData: () => ({ loading: h.loading, error: h.error, moods: h.moods }),
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
  h.user = { id: 'u1' }; h.loading = false; h.error = null; h.navigate = vi.fn()
  h.moods = [{ id: MOOD_ID, films: [{ id: 1, tmdbId: 1001, title: 'Movie 1', year: 2011, runtime: 110, director: 'Dir 1', engineReason: null, synopsis: null, matchPct: 80, poster: '/p1.jpg' }] }]
  vi.clearAllMocks()
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
})

describe('Home data states', () => {
  it('renders the briefing skeleton while loading', () => {
    h.loading = true; h.moods = []
    renderHome()
    expect(screen.getByLabelText("Preparing tonight's briefing")).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('renders an honest error state (role=alert) on data failure', () => {
    h.error = 'PostgREST 500: relation does not exist'
    renderHome()
    const alert = screen.getByRole('alert')
    expect(alert.textContent).toContain('We couldn’t load your home briefing.')
    expect(alert.textContent).toContain('Try refreshing in a moment.')
  })

  it('does not render the raw error detail', () => {
    h.error = 'PostgREST 500: relation does not exist'
    renderHome()
    expect(screen.queryByText(/PostgREST/)).toBeNull()
    expect(screen.queryByText(/relation does not exist/)).toBeNull()
    // The briefing is not rendered on error → no impression-on-render write either.
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
  })

  it('renders the briefing pick when data loads normally', () => {
    renderHome()
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Movie 1')
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
