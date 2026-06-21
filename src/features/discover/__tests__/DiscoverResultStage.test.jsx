import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/shared/lib/supabase/client', () => ({ supabase: { from: () => ({ insert: () => Promise.resolve({ error: null }) }) } }))
vi.mock('@/shared/services/recommendations', () => ({ logSurfaceImpressions: vi.fn(() => Promise.resolve()), updateImpression: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/services/interactions', () => ({ trackInteraction: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/services/betaEvents', () => ({ trackEvent: vi.fn(), EVENTS: {}, errorKind: () => 'x' }))
vi.mock('../hooks/useStreamingProvider', () => ({ useStreamingProvider: () => ({ provider: null, status: 'idle' }) }))
vi.mock('@/shared/api/tmdb', () => ({ tmdbImg: (p) => p }))

import DiscoverResultStage from '../sections/DiscoverResultStage'

const film = (over) => ({
  poster: '/p.jpg', tmdbId: 9000 + over.id, year: 2020, genre: 'Drama', dir: 'A. Director',
  fit: { slow: over.moodFitRaw }, _raw: { mood_tags: ['contemplative'], tone_tags: [], llm_intensity: 50, llm_attention_demand: 50, llm_emotional_depth: 50, llm_pacing: 50, discovery_potential: 30, polarization_score: 20, original_language: 'en' },
  ...over,
})
const RANKED = [
  film({ id: 1, title: 'Lead Film', runtime: 120, moodFitRaw: 0.9, _rankScore: 200, _raw: { mood_tags: ['contemplative'], tone_tags: [], llm_intensity: 80, llm_attention_demand: 80, llm_emotional_depth: 80, llm_pacing: 80, discovery_potential: 20, polarization_score: 20, original_language: 'en' } }),
  film({ id: 2, title: 'Gentler Film', runtime: 100, moodFitRaw: 0.85, _rankScore: 150, _raw: { mood_tags: ['warm'], tone_tags: [], llm_intensity: 20, llm_attention_demand: 20, llm_emotional_depth: 20, llm_pacing: 20, discovery_potential: 20, polarization_score: 20, original_language: 'en' } }),
  film({ id: 3, title: 'Bolder Film', runtime: 130, moodFitRaw: 0.85, _rankScore: 140, _raw: { mood_tags: ['surreal'], tone_tags: [], llm_intensity: 80, llm_attention_demand: 80, llm_emotional_depth: 80, llm_pacing: 80, discovery_potential: 95, polarization_score: 95, original_language: 'ko' } }),
]
const baseProps = {
  selected: ['slow'], profile: { filters: { language_primary: 'en' }, affinities: { directors: [] } }, blendHex: '#A78BFA',
  intention: 'move', energy: 'steady', who: 'alone', time: 'std', user: { id: 'u1' }, sessionKey: 'k1',
  onAdjust: vi.fn(), onRestart: vi.fn(),
}
const renderResult = (props = {}) => render(<MemoryRouter><DiscoverResultStage {...baseProps} {...props} ranked={props.ranked || RANKED} /></MemoryRouter>)

beforeEach(() => vi.clearAllMocks())

describe('DiscoverResultStage — live result', () => {
  it('shows one dominant lead with the Closest-fit role label', () => {
    renderResult()
    expect(screen.getByRole('heading', { level: 1, name: 'Lead Film' })).toBeTruthy()
    expect(screen.getAllByText('Closest fit').length).toBeGreaterThan(0)
  })

  it('always shows a grounded moment reason and never a match %', () => {
    const { container } = renderResult()
    expect(screen.getByText('Why this film')).toBeTruthy()
    expect(container.textContent).not.toMatch(/%/)
    expect(container.textContent).not.toMatch(/perfect for you/i)
  })

  it('renders the descriptive context chips', () => {
    renderResult()
    expect(screen.getByText('Mood')).toBeTruthy()
    expect(screen.getByText('Intention')).toBeTruthy()
    expect(screen.getByText('Energy')).toBeTruthy()
  })

  it('offers two differentiated directions in the dock', () => {
    renderResult()
    expect(screen.getByRole('button', { name: /Gentler direction: Gentler Film/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Bolder direction: Bolder Film/ })).toBeTruthy()
  })

  it('selecting an alternate changes FOCUS but not the films’ roles', () => {
    renderResult()
    fireEvent.click(screen.getByRole('button', { name: /Gentler direction: Gentler Film/ }))
    // the cinematic lead now shows the gentler film, labelled Gentler direction
    expect(screen.getByRole('heading', { level: 1, name: 'Gentler Film' })).toBeTruthy()
    // the closest role still exists as a dock card (role did not become "closest")
    expect(screen.getByRole('button', { name: /Closest fit: Lead Film/ })).toBeTruthy()
  })
})

describe('DiscoverResultStage — fallback honesty', () => {
  const fallbackFilm = { id: 1, title: 'Example Lead', tmdbId: 9001, year: 2019, runtime: 120, dir: 'Bong Joon-ho', genre: 'Thriller', poster: '/p.jpg', moodFitRaw: 0.9, fit: { slow: 0.9 } }
  it('labels the result as an example and shows NO personal Because-line', () => {
    const { container } = renderResult({
      isFallback: true, fallbackReason: 'live_error', ranked: [fallbackFilm],
      profile: { affinities: { directors: [{ name: 'Bong Joon-ho' }] } }, // would match — must still be suppressed
    })
    expect(screen.getByText(/Example pick/i)).toBeTruthy()
    expect(container.textContent).not.toMatch(/Because/i)
    // no alternates fabricated from fallback data
    expect(screen.queryByRole('button', { name: /Gentler direction/ })).toBeNull()
  })
})
