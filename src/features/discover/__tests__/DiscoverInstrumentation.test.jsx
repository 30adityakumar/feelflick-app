import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Spy trackEvent (keep EVENTS/errorKind real) to prove the Discover result actions emit safe
// funnel events carrying ONLY a catalog movie_id — never a title or Stage-2 context.
const trackEventMock = vi.hoisted(() => vi.fn())
vi.mock('@/shared/services/betaEvents', async (orig) => ({ ...(await orig()), trackEvent: trackEventMock }))

const supa = vi.hoisted(() => ({ insertError: null }))
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: () => ({ insert: async () => ({ error: supa.insertError }) }) },
}))
vi.mock('@/shared/services/recommendations', () => ({ updateImpression: vi.fn(() => ({ catch: () => {} })) }))
vi.mock('@/shared/services/interactions', () => ({ trackInteraction: vi.fn(() => ({ catch: () => {} })) }))

import { useDiscoverResultActions } from '../hooks/useDiscoverResultActions'
import { EVENTS } from '@/shared/services/betaEvents'
import discoverSrc from '../Discover.jsx?raw'

const navigate = vi.fn()
const setup = (top) =>
  renderHook(() => useDiscoverResultActions({
    top, user: { id: 'me' }, selected: ['slow'], intention: 'move', energy: 'steady', who: 'alone',
    setHiddenTopIds: () => {}, setSelectedTopId: () => {}, navigate,
  }))

const noTitleLeak = (title) => {
  for (const [, payload] of trackEventMock.mock.calls) {
    expect(JSON.stringify(payload || {})).not.toContain(title)
  }
}

describe('Discover funnel — safe events (movie_id only, no title/context)', () => {
  beforeEach(() => { trackEventMock.mockClear(); supa.insertError = null })

  it('recommendation_opened on "See more" carries movie_id only', () => {
    const { result } = setup({ id: 'm1', tmdbId: 550, title: 'Fight Club' })
    act(() => result.current.handleSeeMore())
    expect(trackEventMock).toHaveBeenCalledWith(EVENTS.recommendation_opened, { surface: 'discover', movie_id: 'm1' })
    noTitleLeak('Fight Club')
  })

  it('recommendation_saved on save carries movie_id only', async () => {
    const { result } = setup({ id: 'm2', tmdbId: 551, title: 'Se7en' })
    await act(async () => { await result.current.handleSaveForLater() })
    expect(trackEventMock).toHaveBeenCalledWith(EVENTS.recommendation_saved, { surface: 'discover', movie_id: 'm2' })
    noTitleLeak('Se7en')
  })

  it('recommendation_error (with error_kind bucket) on a failed save — no raw error', async () => {
    supa.insertError = { code: '42501', message: 'permission denied for table user_watchlist' }
    const { result } = setup({ id: 'm3', tmdbId: 552, title: 'Alien' })
    await act(async () => { await result.current.handleSaveForLater() })
    const call = trackEventMock.mock.calls.find((c) => c[0] === EVENTS.recommendation_error)
    expect(call).toBeTruthy()
    expect(call[1]).toEqual({ surface: 'discover', source: 'save', error_kind: 'permission_denied' })
    noTitleLeak('permission denied')
  })
})

describe('Discover kill-switch — gates scoring + shows an honest fallback (source guard)', () => {
  it('skips scoring before scoreMovieForUser and renders DiscoverPaused when disabled', () => {
    expect(discoverSrc).toMatch(/isEnabled\('discoverRecommendations'\)/)
    // allResults short-circuits to [] BEFORE the scoreMovieForUser loop runs
    const gateIdx = discoverSrc.indexOf('if (!recsEnabled) return []')
    const scoreIdx = discoverSrc.indexOf('scoreMovieForUser(')
    expect(gateIdx).toBeGreaterThan(0)
    expect(gateIdx).toBeLessThan(scoreIdx)
    expect(discoverSrc).toMatch(/<DiscoverPaused/)
  })
})
