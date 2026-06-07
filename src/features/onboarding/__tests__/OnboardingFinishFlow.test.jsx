// src/features/onboarding/__tests__/OnboardingFinishFlow.test.jsx
// F2.20 — locks the FROZEN onboarding finish ordering under test WITHOUT editing
// Onboarding.jsx. Drives the real handleFinish via the rating step's 700ms
// auto-finish and asserts: completeOnboarding({markAuthComplete:false}) + prefetch
// run, then after the 12s hold, navigate('/discover') fires BEFORE
// markOnboardingAuthComplete(). Runs under reduced-motion so framer skips its
// infinite animations during the fake-timer advance (the ordering is identical;
// reduced-motion only skips the 900ms fade wait, which Onboarding does by design).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

const h = vi.hoisted(() => {
  const calls = []
  return {
    calls,
    completeOnboarding: vi.fn((opts) => { calls.push(['completeOnboarding', opts]); return Promise.resolve() }),
    markOnboardingAuthComplete: vi.fn(() => { calls.push(['markOnboardingAuthComplete']); return Promise.resolve() }),
    prefetchHomeData: vi.fn(() => { calls.push(['prefetchHomeData']); return Promise.resolve() }),
    navigate: vi.fn((to) => { calls.push(['navigate', to]) }),
  }
})

vi.mock('@/shared/services/onboarding', () => ({
  completeOnboarding: h.completeOnboarding,
  markOnboardingAuthComplete: h.markOnboardingAuthComplete,
}))
vi.mock('@/features/home/useHomeData', () => ({ prefetchHomeData: h.prefetchHomeData }))
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => h.navigate }))
vi.mock('@/shared/hooks/useAuthSession', () => ({
  useAuthSession: () => ({ ready: true, session: { user: { id: 'u1', user_metadata: {} } } }),
}))
vi.mock('@/shared/lib/auth/onboardingStatus', () => ({ deriveOnboardingStatus: () => ({ isComplete: false }) }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { onboarding_complete: false } }) }) }) }) },
}))
vi.mock('@/shared/api/tmdb', () => ({ tmdbImg: (p) => `https://img/${p}`, searchMovies: vi.fn().mockResolvedValue({ results: [] }) }))

import Onboarding from '../Onboarding'

const DRAFT_KEY = 'ff_onboarding_draft_v1'
function seedDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({
    step: 3, moods: ['cozy'], selectedGenres: [18],
    favoriteMovies: [{ id: 1, title: 'Alpha', poster_path: '/a.jpg', release_date: '2014-01-01' }],
    ratings: {},
  }))
}

beforeEach(() => {
  h.calls.length = 0
  vi.clearAllMocks()
  localStorage.clear()
  // reduced-motion: framer skips infinite animations during the fake-timer advance.
  window.matchMedia = vi.fn().mockImplementation((q) => ({
    matches: /reduced-motion/.test(q), media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
})
afterEach(() => { vi.useRealTimers(); localStorage.clear() })

const names = () => h.calls.map(c => c[0])

// Render Onboarding pre-seeded at the rating step, flush the async auth gate,
// then rate the one film so RatingStep reaches allRated and schedules its 700ms
// auto-finish (= handleFinish).
async function driveToFinish() {
  seedDraft()
  render(<Onboarding />)
  await act(async () => { await vi.advanceTimersByTimeAsync(10) }) // flush auth gate → checking=false
  fireEvent.click(screen.getByRole('button', { name: 'Loved' }))
}

describe('Onboarding finish flow — frozen ordering', () => {
  it('completeOnboarding(markAuthComplete:false) + prefetch, then /discover BEFORE markOnboardingAuthComplete', async () => {
    vi.useFakeTimers()
    await driveToFinish()
    // 700ms auto-finish → handleFinish → 12000ms hold → (fade skipped under reduced) → nav → auth
    await act(async () => { await vi.advanceTimersByTimeAsync(13500) })

    expect(h.completeOnboarding).toHaveBeenCalledTimes(1)
    expect(h.completeOnboarding.mock.calls[0][0]).toMatchObject({ markAuthComplete: false })
    expect(h.prefetchHomeData).toHaveBeenCalled()
    expect(h.markOnboardingAuthComplete).toHaveBeenCalledTimes(1)

    const log = names()
    const completeIdx = log.indexOf('completeOnboarding')
    const navIdx = h.calls.findIndex(c => c[0] === 'navigate' && c[1] === '/discover')
    const authIdx = log.indexOf('markOnboardingAuthComplete')
    expect(completeIdx).toBeGreaterThanOrEqual(0)
    expect(navIdx).toBeGreaterThan(completeIdx)   // navigate only after completion resolves
    expect(authIdx).toBeGreaterThan(navIdx)        // auth flip AFTER navigation
    expect(h.navigate.mock.calls.every(c => c[0] === '/discover')).toBe(true) // sole destination
  })

  it('does NOT navigate or flip auth before the 12s hold elapses', async () => {
    vi.useFakeTimers()
    await driveToFinish()
    await act(async () => { await vi.advanceTimersByTimeAsync(700) })  // handleFinish starts
    await act(async () => { await vi.advanceTimersByTimeAsync(3000) }) // 3s into the 12s hold
    expect(h.completeOnboarding).toHaveBeenCalled()           // started
    expect(h.completeOnboarding.mock.calls[0][0]).toMatchObject({ markAuthComplete: false })
    expect(h.navigate).not.toHaveBeenCalled()                 // not yet
    expect(h.markOnboardingAuthComplete).not.toHaveBeenCalled()
  })
})
