import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'

const h = vi.hoisted(() => {
  const calls = []
  return {
    calls,
    completeOnboarding: vi.fn(options => {
      calls.push(['completeOnboarding', options])
      return Promise.resolve()
    }),
    markOnboardingAuthComplete: vi.fn(() => {
      calls.push(['markOnboardingAuthComplete'])
      return Promise.resolve()
    }),
    prefetchHomeData: vi.fn(() => {
      calls.push(['prefetchHomeData'])
      return Promise.resolve()
    }),
    navigate: vi.fn(destination => calls.push(['navigate', destination])),
  }
})

vi.mock('@/shared/services/onboarding', () => ({
  completeOnboarding: h.completeOnboarding,
  markOnboardingAuthComplete: h.markOnboardingAuthComplete,
}))
vi.mock('@/features/home/useHomeData', () => ({ prefetchHomeData: h.prefetchHomeData }))
vi.mock('react-router-dom', async original => ({ ...(await original()), useNavigate: () => h.navigate }))
vi.mock('@/shared/hooks/useAuthSession', () => ({
  useAuthSession: () => ({ ready: true, session: { user: { id: 'u1', user_metadata: {} } } }),
}))
vi.mock('@/shared/lib/auth/onboardingStatus', () => ({ deriveOnboardingStatus: () => ({ isComplete: false }) }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: { onboarding_complete: false } }) }),
      }),
    }),
  },
}))
vi.mock('@/shared/api/tmdb', () => ({
  tmdbImg: path => `https://img/${path}`,
  searchMovies: vi.fn().mockResolvedValue({ results: [] }),
}))

import Onboarding from '../Onboarding'

const DRAFT_KEY = 'ff_onboarding_draft_v1'

function seedDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({
    step: 3,
    moods: ['cozy'],
    selectedGenres: [18],
    favoriteMovies: [{ id: 1, title: 'Alpha', poster_path: '/a.jpg', release_date: '2014-01-01' }],
    ratings: {},
  }))
}

beforeEach(() => {
  h.calls.length = 0
  vi.clearAllMocks()
  localStorage.clear()
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: /reduced-motion/.test(query),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})

const names = () => h.calls.map(call => call[0])

async function driveToFinish() {
  seedDraft()
  render(<Onboarding />)
  await act(async () => { await vi.advanceTimersByTimeAsync(10) })
  fireEvent.click(screen.getByRole('button', { name: 'Loved' }))
}

describe('Onboarding finish flow — explicit Discover handoff', () => {
  it('finishes writes, enables the CTA, then navigates before flipping auth metadata', async () => {
    vi.useFakeTimers()
    await driveToFinish()

    await act(async () => { await vi.advanceTimersByTimeAsync(4000) })

    expect(h.completeOnboarding).toHaveBeenCalledTimes(1)
    expect(h.completeOnboarding.mock.calls[0][0]).toMatchObject({ markAuthComplete: false })
    expect(h.prefetchHomeData).toHaveBeenCalled()
    expect(h.navigate).not.toHaveBeenCalled()
    expect(h.markOnboardingAuthComplete).not.toHaveBeenCalled()

    const action = screen.getByRole('button', { name: /find my first film/i })
    expect(action).toBeEnabled()

    await act(async () => {
      fireEvent.click(action)
      await Promise.resolve()
    })

    const log = names()
    const completeIndex = log.indexOf('completeOnboarding')
    const navigateIndex = h.calls.findIndex(call => call[0] === 'navigate' && call[1] === '/discover')
    const authIndex = log.indexOf('markOnboardingAuthComplete')

    expect(navigateIndex).toBeGreaterThan(completeIndex)
    expect(authIndex).toBeGreaterThan(navigateIndex)
    expect(h.navigate.mock.calls.every(call => call[0] === '/discover')).toBe(true)
  })

  it('keeps the handoff disabled and does not navigate while writes are settling', async () => {
    vi.useFakeTimers()
    await driveToFinish()

    await act(async () => { await vi.advanceTimersByTimeAsync(1500) })

    expect(h.completeOnboarding).toHaveBeenCalled()
    expect(h.completeOnboarding.mock.calls[0][0]).toMatchObject({ markAuthComplete: false })
    expect(screen.getByRole('button', { name: /tuning your first picks/i })).toBeDisabled()
    expect(h.navigate).not.toHaveBeenCalled()
    expect(h.markOnboardingAuthComplete).not.toHaveBeenCalled()
  })
})
