// src/features/home/__tests__/HomeTrustA11y.test.jsx
// F4.6 — MoodReactor semantics + reduced-motion, Briefing action focus/icon
// semantics, WhyThisPick omission when the reason is null, and PageEndCard target/
// focus. Everything mocked; no live mount/Supabase/TMDB/impression writes.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const h = vi.hoisted(() => ({ user: { id: 'u1' }, moods: [], reason: null, navigate: () => {}, reduced: false }))

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
  return { AnimatePresence: ({ children }) => children, motion: new Proxy({}, { get: (_t, tag) => make(tag) }), useReducedMotion: () => h.reduced }
})
vi.mock('../useHomeData', () => ({
  HomeDataProvider: ({ children }) => children,
  useHomeData: () => ({ loading: false, error: null, moods: h.moods, seenCandidates: [], continueItem: null, dna: null, friends: [], lists: [], twinPulse: [] }),
}))
// NOTE: sections-bottom is NOT mocked — we render the REAL QuickLog (null when
// seenCandidates is empty) + the REAL PageEndCard so its copy/target can be tested.

import Home from '../Home'
import { MoodReactor } from '../sections-top'
import { PageEndCard } from '../sections-bottom'
import { MOOD_META } from '../data'

const MOOD_ID = MOOD_META[0].id
const renderHome = () => render(<MemoryRouter><Home /></MemoryRouter>)

beforeEach(() => {
  h.user = { id: 'u1' }; h.navigate = vi.fn(); h.reason = null; h.reduced = false
  h.moods = [{ id: MOOD_ID, films: [{ id: 1, tmdbId: 555, title: 'Movie 1', year: 2011, runtime: 110, director: 'Dir 1', engineReason: h.reason, synopsis: null, poster: '/p1.jpg' }] }]
  vi.clearAllMocks()
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  // jsdom has no scrollIntoView; default it to a no-op so MoodReactor's effect
  // never throws when an overflow is (incidentally) present.
  Element.prototype.scrollIntoView = vi.fn()
})

// ── MoodReactor ───────────────────────────────────────────────────────────────
describe('MoodReactor semantics (F4.6)', () => {
  const renderMood = (setMood = vi.fn()) => render(<MoodReactor currentMood={MOOD_META[0]} setMood={setMood} />)

  it('groups the mood options with an accessible label', () => {
    renderMood()
    expect(screen.getByRole('group', { name: "Adjust tonight's mood" })).toBeTruthy()
  })

  it('marks the current mood aria-pressed=true and the rest false', () => {
    renderMood()
    const current = screen.getByRole('button', { name: new RegExp(MOOD_META[0].label) })
    expect(current.getAttribute('aria-pressed')).toBe('true')
    const other = screen.getByRole('button', { name: new RegExp(MOOD_META[1].label) })
    expect(other.getAttribute('aria-pressed')).toBe('false')
  })

  it('keeps visible mood labels and exposes the 44px + focus contract', () => {
    renderMood()
    for (const m of MOOD_META) {
      const btn = screen.getByRole('button', { name: new RegExp(m.label) })
      expect(btn.textContent).toContain(m.label)
      expect(btn.style.minHeight).toBe('44px')
      expect(btn.className).toMatch(/focus-visible:ring/)
    }
  })

  it('selecting a mood calls setMood with that mood', () => {
    const setMood = vi.fn()
    renderMood(setMood)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(MOOD_META[1].label) }))
    expect(setMood).toHaveBeenCalledWith(MOOD_META[1])
  })

  it('uses smooth active-pill scroll normally and auto under reduced motion', () => {
    const scrollSpy = vi.fn()
    const origScroll = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = scrollSpy
    // Force horizontal overflow so the (otherwise no-op) scroll effect runs.
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 1000 })
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 100 })
    try {
      h.reduced = false
      renderMood()
      expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
      scrollSpy.mockClear()
      h.reduced = true
      renderMood()
      expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }))
    } finally {
      Element.prototype.scrollIntoView = origScroll
      delete HTMLElement.prototype.scrollWidth
      delete HTMLElement.prototype.clientWidth
    }
  })
})

// ── Briefing focus / icon semantics ───────────────────────────────────────────
describe('Briefing action focus + icon semantics (F4.6)', () => {
  it('gives the primary + secondary actions a visible focus ring', () => {
    renderHome()
    for (const name of ['Open Film File', 'Mark Watched', 'Save', 'Not tonight']) {
      expect(screen.getByRole('button', { name }).className).toMatch(/focus-visible:ring/)
    }
  })

  it('marks the action icons decorative (aria-hidden)', () => {
    const { container } = renderHome()
    const open = screen.getByRole('button', { name: 'Open Film File' })
    expect(open.querySelector('svg[aria-hidden="true"]')).toBeTruthy()
    // every svg inside the action row buttons is decorative
    const watched = screen.getByRole('button', { name: 'Mark Watched' })
    expect(watched.querySelector('svg[aria-hidden="true"]')).toBeTruthy()
    expect(container).toBeTruthy()
  })

  it('the poster button has an accessible name + focus ring', () => {
    renderHome()
    const poster = screen.getByRole('button', { name: 'Open Film File for Movie 1' })
    expect(poster.className).toMatch(/focus-visible:ring/)
  })
})

// ── WhyThisPick omission ──────────────────────────────────────────────────────
describe('WhyThisPick honesty (F4.6)', () => {
  it('renders the reason when present', () => {
    h.moods = [{ id: MOOD_ID, films: [{ id: 1, tmdbId: 555, title: 'Movie 1', engineReason: 'Because you loved Past Lives', poster: '/p1.jpg' }] }]
    renderHome()
    expect(screen.getByText(/Because you loved Past Lives/)).toBeTruthy()
  })

  it('renders no reason panel when the engine reason is null', () => {
    h.moods = [{ id: MOOD_ID, films: [{ id: 1, tmdbId: 555, title: 'Movie 1', engineReason: null, poster: '/p1.jpg' }] }]
    renderHome()
    expect(screen.queryByText(/Because you loved/)).toBeNull()
    expect(screen.queryByText(/for your .* night/i)).toBeNull() // no fabricated mood sentence
  })
})

// ── PageEndCard ───────────────────────────────────────────────────────────────
describe('PageEndCard target + focus (F4.6)', () => {
  it('Open Discover retains the callback and the 44px / focus contract', () => {
    const onDiscover = vi.fn()
    render(<PageEndCard currentMood={MOOD_META[0]} onDiscover={onDiscover} />)
    const cta = screen.getByRole('button', { name: /Open Discover/i })
    expect(cta.style.minHeight).toBe('44px')
    expect(cta.className).toMatch(/focus-visible:ring/)
    fireEvent.click(cta)
    expect(onDiscover).toHaveBeenCalledTimes(1)
  })

  it('keeps role-clear copy (Home already picked; Discover is the deliberate path)', () => {
    render(<PageEndCard currentMood={MOOD_META[0]} onDiscover={vi.fn()} />)
    expect(screen.getByText(/already set above/i)).toBeTruthy()
    expect(screen.getByText(/deliberate path/i)).toBeTruthy()
    expect(screen.queryByText(/actually fits tonight/i)).toBeNull()
  })
})
