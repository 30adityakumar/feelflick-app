// src/features/onboarding/__tests__/OnboardingDraft.test.jsx
// F2.23 — Onboarding-level draft isolation: a different user does NOT hydrate
// another user's scoped draft, the same user DOES restore theirs, and an
// already-onboarded user's stale draft is cleared on the redirect. (The progressbar
// aria-valuenow = step + 1 is the stable proxy for the restored step.)

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { saveDraft, loadDraft } from '../draft'

const h = vi.hoisted(() => ({ session: { user: { id: 'B' } }, isComplete: false, dbComplete: false, navigate: () => {} }))

vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ ready: true, session: h.session }) }))
vi.mock('@/shared/lib/auth/onboardingStatus', () => ({ deriveOnboardingStatus: () => ({ hasAny: true, isComplete: h.isComplete }) }))
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { onboarding_complete: h.dbComplete } }) }) }) }) },
}))
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => h.navigate }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/shared/services/onboarding', () => ({ completeOnboarding: vi.fn().mockResolvedValue(), markOnboardingAuthComplete: vi.fn().mockResolvedValue() }))
vi.mock('@/features/home/useHomeData', () => ({ prefetchHomeData: vi.fn().mockResolvedValue() }))
vi.mock('@/shared/api/tmdb', () => ({ tmdbImg: (p) => `https://img/${p}`, searchMovies: vi.fn().mockResolvedValue({ results: [] }) }))

import Onboarding from '../Onboarding'

beforeEach(() => {
  localStorage.clear()
  h.session = { user: { id: 'B' } }
  h.isComplete = false
  h.dbComplete = false
  h.navigate = vi.fn()
  window.matchMedia = vi.fn().mockImplementation((q) => ({
    matches: false, media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
})

describe('Onboarding — user-scoped draft isolation', () => {
  it('does NOT hydrate another user’s draft — user B starts fresh, user A is untouched', async () => {
    saveDraft('A', { step: 3, moods: ['cozy'], selectedGenres: [18], favoriteMovies: [{ id: 1, title: 'X' }], ratings: { 1: 9 } })
    h.session = { user: { id: 'B' } }
    render(<Onboarding />)
    const bar = await screen.findByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '1') // step 0, not A's step 3
    expect(loadDraft('A')).toMatchObject({ step: 3 })  // A's draft untouched
  })

  it('restores the SAME user’s scoped draft on mount', async () => {
    saveDraft('A', { step: 1, moods: ['cozy'], selectedGenres: [18], favoriteMovies: [], ratings: {} })
    h.session = { user: { id: 'A' } }
    render(<Onboarding />)
    const bar = await screen.findByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '2') // step 1 restored
  })

  it('clears the user’s stale draft and redirects to /home when already onboarded', async () => {
    saveDraft('A', { step: 2, moods: ['cozy'] })
    h.session = { user: { id: 'A' } }
    h.isComplete = true
    render(<Onboarding />)
    await waitFor(() => expect(h.navigate).toHaveBeenCalledWith('/home', { replace: true }))
    expect(loadDraft('A')).toBeNull()
  })
})
