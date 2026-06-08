// src/features/home/__tests__/HomeSupportingSections.test.jsx
// F4.5 — the Home tail is a restrained, pick-supporting trail, not a dashboard /
// browse wall / social feed. Renders the REAL QuickLog + PageEndCard (the removed
// sections are simply absent because Home no longer imports them) over mocked data
// — no live mount/Supabase/TMDB/impression writes.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const h = vi.hoisted(() => ({ user: { id: 'u1' }, moods: [], seen: [], loading: false, error: null, navigate: () => {} }))

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
// Provide all the keys the supporting sections read; the removed ones are NOT
// rendered by Home, so their (empty) data just confirms nothing leaks through.
vi.mock('../useHomeData', () => ({
  HomeDataProvider: ({ children }) => children,
  useHomeData: () => ({
    loading: h.loading, error: h.error, moods: h.moods, seenCandidates: h.seen,
    continueItem: null, dna: null, friends: [], lists: [], twinPulse: [],
  }),
}))

import Home from '../Home'
import { MOOD_META } from '../data'

const MOOD_ID = MOOD_META[0].id
const renderHome = () => render(<MemoryRouter><Home /></MemoryRouter>)
const before = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

beforeEach(() => {
  h.user = { id: 'u1' }; h.loading = false; h.error = null; h.navigate = vi.fn()
  h.moods = [{ id: MOOD_ID, films: [{ id: 1, tmdbId: 1001, title: 'Movie 1', year: 2011, runtime: 110, director: 'Dir 1', engineReason: null, synopsis: null, matchPct: 80, poster: '/p1.jpg' }] }]
  h.seen = [{ id: 50, title: 'Seen A', poster_path: '/sa.jpg' }, { id: 51, title: 'Seen B', poster_path: '/sb.jpg' }]
  vi.clearAllMocks()
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
})

describe('Home supporting sections (F4.5)', () => {
  it('does not render ContinueWatching (no real resume-progress data)', () => {
    renderHome()
    expect(screen.queryByText(/Pick up where you paused/i)).toBeNull()
    expect(screen.queryByText(/In Progress/i)).toBeNull()
    expect(screen.queryByText(/continue watching/i)).toBeNull()
  })

  it('does not render the browse-wall / social / DNA sections on Home', () => {
    renderHome()
    expect(screen.queryByText(/Curated edits/i)).toBeNull()
    expect(screen.queryByText(/Lists, hand-cut/i)).toBeNull()
    expect(screen.queryByText(/taste twins/i)).toBeNull()        // TasteMatch
    expect(screen.queryByText(/Taste-twin pulse/i)).toBeNull()   // TasteTwinPulse
    expect(screen.queryByText(/Cinematic DNA/i)).toBeNull()      // CinematicDNA
  })

  it('keeps QuickLog as the repeat-value tail utility', () => {
    renderHome()
    expect(screen.getByText(/Have you seen any of these\?/i)).toBeTruthy()
    expect(screen.getByText(/Feed the engine/i)).toBeTruthy()
  })

  it('keeps QuickLog honest — it logs inline and offers Browse as a secondary jump', () => {
    renderHome()
    // The section is explicitly about logging films you have already watched.
    expect(screen.getByText(/already watched/i)).toBeTruthy()
    // Browse is a clearly-labelled secondary catalog jump, not the only action.
    expect(screen.getByRole('button', { name: /Open Browse/i })).toBeTruthy()
  })

  it('keeps PageEndCard and routes its CTA to /discover', () => {
    renderHome()
    const cta = screen.getByRole('button', { name: /Open Discover/i })
    fireEvent.click(cta)
    expect(h.navigate).toHaveBeenCalledWith('/discover')
  })

  it('PageEndCard copy distinguishes Home (already picked) from Discover (deliberate) and drops the "fits better" implication', () => {
    renderHome()
    expect(screen.getByText(/already set above/i)).toBeTruthy()
    expect(screen.getByText(/deliberate path/i)).toBeTruthy()
    expect(screen.queryByText(/actually fits tonight/i)).toBeNull() // old misleading copy gone
  })

  it('renders the tail (QuickLog → PageEndCard) AFTER the Briefing pick and Adjust-mood strip', () => {
    renderHome()
    const pick = screen.getByRole('heading', { level: 2, name: 'Movie 1' })
    const moodKicker = screen.getByText('Adjust mood')
    const quickLog = screen.getByText(/Have you seen any of these\?/i)
    const discoverCta = screen.getByRole('button', { name: /Open Discover/i })
    expect(before(pick, moodKicker)).toBe(true)
    expect(before(moodKicker, quickLog)).toBe(true)
    expect(before(quickLog, discoverCta)).toBe(true)
  })

  it('does not leave blank/empty supporting regions or a browse-wall heading dominating the tail', () => {
    renderHome()
    // The only catalog reference in the tail is QuickLog's secondary Open Browse.
    expect(screen.getAllByRole('button', { name: /Open Browse/i })).toHaveLength(1)
    // No loud browse-wall heading competes with the pick.
    expect(screen.queryByText(/Curated edits|Lists, hand-cut for you/i)).toBeNull()
  })

  it('renders only the Briefing + QuickLog + PageEndCard sections (no empty placeholders)', () => {
    const { container } = renderHome()
    // Three <section>s remain: TheBriefing, MoodReactor, QuickLog... + PageEndCard.
    // The removed sections leave no orphaned/empty landmarks.
    const sections = container.querySelectorAll('section')
    expect(sections.length).toBeLessThanOrEqual(4)
    expect(sections.length).toBeGreaterThanOrEqual(3)
  })
})
