// src/features/discover/__tests__/DiscoverEntry.test.jsx
// F3.5 — the Discover entry: /discover opens directly on the mood front door
// (StageHero removed), an onboarding arrival seeds the constellation from ALL
// baseline moods (deduped, order-preserved, capped at three), and an ordinary
// visit starts empty (no invented "recent mood"). Mounts the real Discover with
// mocked data — no live fetch, no writes.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const h = vi.hoisted(() => ({ baselineMoods: [] }))

vi.mock('../useDiscoverData', () => ({
  DiscoverDataProvider: ({ children }) => children,
  useDiscoverData: () => ({ films: [], profile: { affinities: { directors: [] } }, baselineMoods: h.baselineMoods, learnedPrefs: null, recentSaves: [] }),
}))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: { id: 'u1' } }) }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }), upsert: () => Promise.resolve({ error: null }) }) },
}))

import Discover from '../Discover'

const renderDiscover = ({ fromOnboarding = false } = {}) => {
  const entries = fromOnboarding ? [{ pathname: '/discover', state: { fromOnboarding: true } }] : ['/discover']
  return render(<MemoryRouter initialEntries={entries}><Discover /></MemoryRouter>)
}
const moodBtn = (label) => screen.getByText(label, { selector: '.ff-mood-label' }).closest('button')
const pressedCount = () => screen.getAllByRole('button').filter(b => b.getAttribute('aria-pressed') === 'true').length

beforeEach(() => {
  h.baselineMoods = []
  window.matchMedia = vi.fn().mockImplementation((q) => ({
    matches: false, media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
})

describe('Discover entry — mood front door', () => {
  it('opens directly on StageMood (no StageHero "How do you feel?" launch screen)', () => {
    renderDiscover()
    expect(screen.getByRole('heading', { name: /shape.*of your mood/i })).toBeInTheDocument()
    expect(screen.queryByText(/How do you feel\?/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /surprise me/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /begin/i })).not.toBeInTheDocument()
  })

  it('an ordinary/direct visit starts with NO mood selected', () => {
    renderDiscover()
    expect(pressedCount()).toBe(0)
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })
})

describe('Discover entry — onboarding handoff', () => {
  it('seeds the constellation from the mapped baseline moods', async () => {
    h.baselineMoods = ['cozy', 'wired', 'tender'] // → cozy, cerebral, tender
    renderDiscover({ fromOnboarding: true })
    await waitFor(() => expect(moodBtn('Cozy')).toHaveAttribute('aria-pressed', 'true'))
    expect(moodBtn('Cerebral')).toHaveAttribute('aria-pressed', 'true')
    expect(moodBtn('Tender')).toHaveAttribute('aria-pressed', 'true')
    expect(pressedCount()).toBe(3)
  })

  it('deduplicates and caps the seed at three moods', async () => {
    h.baselineMoods = ['cozy', 'cozy', 'wired', 'tender', 'fun', 'tense'] // → cozy, cerebral, tender, restless, tense → cap 3
    renderDiscover({ fromOnboarding: true })
    await waitFor(() => expect(pressedCount()).toBe(3))
    expect(moodBtn('Cozy')).toHaveAttribute('aria-pressed', 'true')
    expect(moodBtn('Cerebral')).toHaveAttribute('aria-pressed', 'true')
    expect(moodBtn('Tender')).toHaveAttribute('aria-pressed', 'true')
    expect(moodBtn('Restless')).toHaveAttribute('aria-pressed', 'false') // dropped by the 3-cap
  })

  it('preserves the baseline order in the selection badges', async () => {
    h.baselineMoods = ['tender', 'cozy'] // → tender (1), cozy (2)
    renderDiscover({ fromOnboarding: true })
    await waitFor(() => expect(moodBtn('Tender')).toHaveAttribute('aria-pressed', 'true'))
    expect(within(moodBtn('Tender')).getByText('1')).toBeInTheDocument()
    expect(within(moodBtn('Cozy')).getByText('2')).toBeInTheDocument()
  })

  it('does NOT seed when there are no baseline moods', async () => {
    h.baselineMoods = []
    renderDiscover({ fromOnboarding: true })
    await Promise.resolve()
    expect(pressedCount()).toBe(0)
  })
})
