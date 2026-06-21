// src/features/discover/__tests__/DiscoverFidelity.test.jsx
// Structural fidelity guards for the prototype-faithful composition. These assert the
// corrected ARCHITECTURE (open mood field, centred constellation, one integrated
// context card, full-bleed cinematic result, attached dock) — not exact CSS values
// or class order (visual regression is the primary composition check).

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/shared/lib/supabase/client', () => ({ supabase: { from: () => ({ insert: () => Promise.resolve({ error: null }) }) } }))
vi.mock('@/shared/services/recommendations', () => ({ logSurfaceImpressions: vi.fn(() => Promise.resolve()), updateImpression: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/services/interactions', () => ({ trackInteraction: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/services/betaEvents', () => ({ trackEvent: vi.fn(), EVENTS: {}, errorKind: () => 'x' }))
vi.mock('../hooks/useStreamingProvider', () => ({ useStreamingProvider: () => ({ provider: null, status: 'idle' }) }))
vi.mock('@/shared/api/tmdb', () => ({ tmdbImg: (p) => p }))

import DiscoverMoodStage from '../sections/DiscoverMoodStage'
import DiscoverContextStage from '../sections/DiscoverContextStage'
import DiscoverResultStage from '../sections/DiscoverResultStage'

// ── Mood stage ────────────────────────────────────────────────────────────────
function MoodHarness() {
  const [selected, setSelected] = useState([])
  return <DiscoverMoodStage selected={selected} setSelected={setSelected} onNext={vi.fn()} />
}

describe('fidelity — mood stage is an open field with a centred constellation', () => {
  it('has NO bordered enclosing constellation card (the old .ff-disc-canvas is gone)', () => {
    const { container } = render(<MoodHarness />)
    expect(container.querySelector('.ff-disc-canvas')).toBeNull()
    expect(container.querySelector('.ff-disc-field')).toBeTruthy() // open field instead
  })

  it('renders the centred constellation identity once moods are chosen', () => {
    const { container } = render(<MoodHarness />)
    expect(container.querySelector('.ff-disc-constellation')).toBeNull() // none before selection
    fireEvent.click(screen.getByRole('button', { name: /^Tender/ }))
    const centre = container.querySelector('.ff-disc-constellation')
    expect(centre).toBeTruthy()
    expect(centre.textContent).toMatch(/Your constellation/i)
  })

  it('does NOT render a visible selected-mood card grid', () => {
    const { container } = render(<MoodHarness />)
    fireEvent.click(screen.getByRole('button', { name: /^Tender/ }))
    expect(container.querySelector('.ff-disc-mood-summary__list')).toBeNull()
    expect(container.querySelector('.ff-disc-mood-summary__item')).toBeNull()
    // descriptions still present accessibly (text, not title-only)
    expect(screen.getByText('Nights that ache softly.')).toBeTruthy()
  })
})

// ── Context stage ───────────────────────────────────────────────────────────────
function CtxHarness() {
  const [intention, setIntention] = useState('move')
  const [time, setTime] = useState('std')
  const [who, setWho] = useState('alone')
  const [energy, setEnergy] = useState('steady')
  return (
    <DiscoverContextStage selected={['slow', 'tender']}
      time={time} setTime={setTime} who={who} setWho={setWho} energy={energy} setEnergy={setEnergy} intention={intention} setIntention={setIntention}
      onUserEdit={vi.fn()} onNext={vi.fn()} onBack={vi.fn()} />
  )
}

describe('fidelity — context is ONE integrated card with a constellation hero', () => {
  it('renders a single context card containing the tinted hero and the rows', () => {
    const { container } = render(<CtxHarness />)
    const card = container.querySelector('.ff-disc-ctx-card')
    expect(card).toBeTruthy()
    expect(card.querySelector('.ff-disc-ctx-hero')).toBeTruthy()
    // rows live INSIDE the one card (not four standalone cards)
    expect(card.querySelectorAll('.ff-disc-ctx__row').length).toBe(4)
    expect(container.querySelectorAll('.ff-disc-ctx-card').length).toBe(1)
  })

  it('hero shows the constellation name + a live context sentence that updates on edit', () => {
    const { container } = render(<CtxHarness />)
    const hero = container.querySelector('.ff-disc-ctx-hero')
    expect(hero.querySelector('.ff-disc-ctx-hero__name').textContent).toMatch(/Quiet Ache/i) // slow+tender
    expect(hero.querySelector('.ff-disc-ctx-hero__sentence').textContent).toMatch(/Move me/)
    // change a value → sentence reflects it immediately
    fireEvent.click(screen.getByRole('button', { name: /Energy/ }))
    fireEvent.click(screen.getByRole('button', { name: /Wired — Give me edges/i }))
    expect(container.querySelector('.ff-disc-ctx-hero__sentence').textContent).toMatch(/Wired/)
  })
})

// ── Result stage ────────────────────────────────────────────────────────────────
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
  intention: 'move', energy: 'steady', who: 'alone', time: 'std', user: { id: 'u1' }, sessionKey: 'k1', onAdjust: vi.fn(), onRestart: vi.fn(),
}
const renderResult = (props = {}) => render(<MemoryRouter><DiscoverResultStage {...baseProps} {...props} ranked={props.ranked || RANKED} /></MemoryRouter>)

beforeEach(() => vi.clearAllMocks())

describe('fidelity — result is a full-bleed cinematic stage, not a poster-card detail', () => {
  it('renders the backdrop, masked artwork, and scrim layers', () => {
    const { container } = renderResult()
    expect(container.querySelector('.ff-disc-result__backdrop')).toBeTruthy()
    expect(container.querySelector('.ff-disc-result__art')).toBeTruthy()
    expect(container.querySelector('.ff-disc-result__scrim')).toBeTruthy()
  })

  it('does NOT use a standalone lead poster rectangle as the primary image', () => {
    const { container } = renderResult()
    expect(container.querySelector('.ff-disc-lead__poster')).toBeNull()
    expect(container.querySelector('.ff-disc-lead__poster-wrap')).toBeNull()
    // the artwork is the background image plane, not an <img> poster card
    const art = container.querySelector('.ff-disc-result__art')
    expect(art.getAttribute('style') || '').toMatch(/background-image/i)
  })

  it('low-left copy lives in the cinematic inner shell with the oversized title', () => {
    const { container } = renderResult()
    const copy = container.querySelector('.ff-disc-result__inner .ff-disc-result__copy')
    expect(copy).toBeTruthy()
    expect(copy.querySelector('h1.ff-disc-lead__title').textContent).toBe('Lead Film')
  })

  it('the moment-fit reason remains visible (not only the disclosure)', () => {
    renderResult()
    expect(screen.getByText('Why this film')).toBeTruthy()
    expect(screen.getByText(/Tuned to/i)).toBeTruthy() // the always-visible moment-fit line
  })

  it('attaches a translucent dock with the alternate direction cards', () => {
    const { container } = renderResult()
    const dock = container.querySelector('.ff-disc-dock .ff-disc-dock__shell')
    expect(dock).toBeTruthy()
    expect(container.querySelectorAll('.ff-disc-dir').length).toBeGreaterThanOrEqual(2)
  })

  it('does NOT render its own AppShell chrome (header / global nav / search)', () => {
    const { container } = renderResult()
    expect(container.querySelector('header')).toBeNull()
    expect(container.querySelector('nav')).toBeNull() // the dock is a labelled section, not a nav
  })
})
