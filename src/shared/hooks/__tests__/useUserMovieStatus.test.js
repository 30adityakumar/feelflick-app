import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Mutable per-test status the mocked supabase reads back during status-sync.
const state = { user_watchlist: null, user_history: null }

function makeQb(table) {
  const qb = {
    select: () => qb,
    eq: () => qb,
    delete: () => qb,
    insert: () => Promise.resolve({ error: null }),
    upsert: () => Promise.resolve({ error: null }),
    maybeSingle: () => Promise.resolve({ data: state[table] ?? null }),
    // Thenable so `await supabase.from(t).delete().eq().eq()` resolves.
    then: (resolve) => resolve({ data: null, error: null }),
  }
  return qb
}
const from = vi.fn((table) => makeQb(table))

vi.mock('@/shared/lib/supabase/client', () => ({ supabase: { from: (...a) => from(...a) } }))
vi.mock('@/shared/lib/movies/ensureMovieInDb', () => ({ ensureMovieInDb: vi.fn(() => Promise.resolve(101)) }))
vi.mock('@/shared/lib/cache', () => ({ recommendationCache: { invalidateUser: vi.fn() } }))

const recordRecommendationOutcome = vi.fn(() => Promise.resolve({ attributed: true, reason: 'attributed' }))
vi.mock('@/shared/services/recommendationOutcomes', () => ({
  recordRecommendationOutcome: (...a) => recordRecommendationOutcome(...a),
}))

import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'

const USER = { id: 'u1' }
const MOVIE = { id: 101, tmdb_id: 999, title: 'Test Film' }

// F8B wiring contract: the canonical save/watch hook attributes positive
// outcomes (add/mark) to a recommendation, and does NOT attribute the inverse
// (remove/unmark). The attribution helper itself decides whether a real recent
// impression exists — see recommendationOutcomes.test.js.
describe('useUserMovieStatus — recommendation outcome wiring (F8B)', () => {
  beforeEach(() => {
    state.user_watchlist = null
    state.user_history = null
    recordRecommendationOutcome.mockClear()
    from.mockClear()
  })

  it('attributes a save (watchlist ADD) with action "saved"', async () => {
    const { result } = renderHook(() => useUserMovieStatus({ user: USER, movie: MOVIE, source: 'mood_recommendation' }))
    await waitFor(() => expect(result.current.internalId).toBe(101))

    await act(async () => { await result.current.toggleWatchlist() })

    expect(recordRecommendationOutcome).toHaveBeenCalledWith({ userId: 'u1', movieId: 101, action: 'saved' })
  })

  it('attributes a mark-watched with action "watched"', async () => {
    const { result } = renderHook(() => useUserMovieStatus({ user: USER, movie: MOVIE, source: 'mood_recommendation' }))
    await waitFor(() => expect(result.current.internalId).toBe(101))

    await act(async () => { await result.current.toggleWatched() })

    expect(recordRecommendationOutcome).toHaveBeenCalledWith({ userId: 'u1', movieId: 101, action: 'watched' })
  })

  it('does NOT attribute when REMOVING from watchlist', async () => {
    state.user_watchlist = { movie_id: 101 } // start saved → toggle removes
    const { result } = renderHook(() => useUserMovieStatus({ user: USER, movie: MOVIE, source: 'mood_recommendation' }))
    await waitFor(() => expect(result.current.isInWatchlist).toBe(true))

    await act(async () => { await result.current.toggleWatchlist() })

    expect(recordRecommendationOutcome).not.toHaveBeenCalled()
  })

  it('does NOT attribute when UNMARKING watched', async () => {
    state.user_history = { movie_id: 101 } // start watched → toggle unmarks
    const { result } = renderHook(() => useUserMovieStatus({ user: USER, movie: MOVIE, source: 'mood_recommendation' }))
    await waitFor(() => expect(result.current.isWatched).toBe(true))

    await act(async () => { await result.current.toggleWatched() })

    expect(recordRecommendationOutcome).not.toHaveBeenCalled()
  })
})
