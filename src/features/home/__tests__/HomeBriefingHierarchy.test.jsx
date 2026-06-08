// src/features/home/__tests__/HomeBriefingHierarchy.test.jsx
// F4.4 — Home is pick-first. Asserts the redesigned hierarchy: the one pick leads,
// MoodReactor is a demoted "Adjust mood" strip below it, Reshuffle / slider-dots /
// match ring are gone, actions are revoiced (Open Film File / Not tonight), the
// internal queue stays invisible, and supporting sections still follow. Fully
// mocked — no live mount/Supabase/TMDB/impressions.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
// Mark the supporting sections so DOM-order assertions can find them.
vi.mock('../sections-bottom', () => ({
  ContinueWatching: () => null,
  CinematicDNA: () => null,
  TasteTwinPulse: () => null,
  TasteMatch: () => null,
  CuratedLists: () => null,
  QuickLog: () => null,
  PageEndCard: () => <div data-testid="page-end-card">end</div>,
}))

import Home from '../Home'
import { MOOD_META } from '../data'

const MOOD_ID = MOOD_META[0].id
const film = (id, over = {}) => ({ id, tmdbId: 1000 + id, title: `Movie ${id}`, year: 2010 + id, runtime: 110, director: `Dir ${id}`, engineReason: null, synopsis: null, matchPct: 80, poster: `/p${id}.jpg`, ...over })
const renderHome = () => render(<MemoryRouter><Home /></MemoryRouter>)
// true when `a` comes before `b` in document order
const before = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

beforeEach(() => {
  h.user = { id: 'u1' }; h.loading = false; h.error = null; h.navigate = vi.fn()
  h.moods = [{ id: MOOD_ID, films: [film(1), film(2), film(3)] }]
  vi.clearAllMocks()
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
})

describe('Home Briefing — pick-first hierarchy (F4.4)', () => {
  it('renders the Briefing pick BEFORE the mood controls in DOM order', () => {
    renderHome()
    const pick = screen.getByRole('heading', { level: 2 })
    const moodKicker = screen.getByText('Adjust mood')
    expect(before(pick, moodKicker)).toBe(true)
  })

  it('labels the mood strip "Adjust mood" (not a front-door prompt)', () => {
    renderHome()
    expect(screen.getByText('Adjust mood')).toBeTruthy()
    expect(screen.queryByText(/tonight i feel/i)).toBeNull()
  })

  it('has no Reshuffle control', () => {
    renderHome()
    expect(screen.queryByRole('button', { name: /reshuffle/i })).toBeNull()
    expect(screen.queryByTitle(/reshuffle/i)).toBeNull()
  })

  it('has no visible slider / dot / next-previous navigation', () => {
    renderHome()
    for (const name of [/next/i, /previous/i, /slide/i]) {
      expect(screen.queryByRole('button', { name })).toBeNull()
    }
  })

  it('shows exactly one film title (the head) — the rest of the queue is invisible', () => {
    renderHome()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
    // The other two queued films are not rendered anywhere.
    const shown = screen.getByRole('heading', { level: 2 }).textContent
    const others = ['Movie 1', 'Movie 2', 'Movie 3'].filter(t => t !== shown)
    for (const t of others) expect(screen.queryByText(t)).toBeNull()
  })

  it('does not render a queue length / "N more" indicator', () => {
    renderHome()
    expect(screen.queryByText(/\d+\s*(more|picks|left|remaining)/i)).toBeNull()
  })

  it('does not show a match ring / visible match percentage', () => {
    renderHome()
    expect(screen.queryByText(/\d+\s*%/)).toBeNull()
  })

  it('advances to the next internal result on Not tonight (and the prior pick disappears)', async () => {
    renderHome()
    const first = screen.getByRole('heading', { level: 2 }).textContent
    // before skip: the next film is not visible
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Not tonight' }))
    await waitFor(() => expect(screen.getByRole('heading', { level: 2 }).textContent).not.toBe(first))
    expect(screen.queryByText(first)).toBeNull() // prior pick gone
  })

  it('revoices the primary action to "Open Film File" and the poster label to match', () => {
    renderHome()
    expect(screen.getByRole('button', { name: 'Open Film File' })).toBeTruthy()
    const shown = screen.getByRole('heading', { level: 2 }).textContent
    expect(screen.getByRole('button', { name: `Open Film File for ${shown}` })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /see more/i })).toBeNull()
  })

  it('revoices Skip to "Not tonight"', () => {
    renderHome()
    expect(screen.getByRole('button', { name: 'Not tonight' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /skip tonight/i })).toBeNull()
  })

  it('still renders Save and Mark Watched', () => {
    renderHome()
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mark Watched' })).toBeTruthy()
  })

  it('renders WhyThisPick when the engine reason exists', () => {
    h.moods = [{ id: MOOD_ID, films: [film(1, { engineReason: 'Because you loved Past Lives' })] }]
    renderHome()
    expect(screen.getByText(/Because you loved Past Lives/)).toBeTruthy()
  })

  it('renders the synopsis when present (unchanged)', () => {
    h.moods = [{ id: MOOD_ID, films: [film(1, { synopsis: 'A quiet, tender story about memory.' })] }]
    renderHome()
    expect(screen.getByText('A quiet, tender story about memory.')).toBeTruthy()
  })

  it('keeps supporting sections after the Briefing + mood controls', () => {
    renderHome()
    const pick = screen.getByRole('heading', { level: 2 })
    const moodKicker = screen.getByText('Adjust mood')
    const supporting = screen.getByTestId('page-end-card')
    expect(before(pick, supporting)).toBe(true)
    expect(before(moodKicker, supporting)).toBe(true)
  })
})
