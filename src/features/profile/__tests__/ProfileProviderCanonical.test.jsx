import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// F7.3 — provider wiring: useProfileDataFetch must canonicalise the owner's raw history at the
// boundary, so the downstream derivations (and the visible stats) count each film once; and a
// failed query must surface the safe `load_error` classification, never raw backend text.

// getTasteFingerprint is exercised by its own canonical test — stub it here so this test isolates
// the orchestrator's history canonicalisation.
vi.mock('@/shared/services/tasteCache', () => ({
  getTasteFingerprint: () => Promise.resolve({ topMoodTags: [{ key: 'tender', count: 1, share: 1 }], topToneTags: [], topFitProfiles: [], total: 2 }),
}))

// Controllable per-table Supabase result. Duplicate Film A (×3) + Film B once. A fresh editorial
// row makes the self-view regen a no-op (no Edge Function / fetch / cache write in the test).
let historyResult
const FRESH_EDITORIAL = { editorial_summary: 's', editorial_signature: 'g', editorial_archetype: ['a', 'b', 'c'], editorial_generated_at: '2999-01-01T00:00:00Z' }
const A = (watched_at) => ({ movie_id: 1, watched_at, movies: { runtime: 120, mood_tags: ['tender'], tone_tags: ['quiet'], fit_profile: 'slow', director_name: 'D', release_date: '2021-01-01', title: 'A' } })
const ROWS = [A('2026-03-01T20:00:00Z'), A('2026-03-02T20:00:00Z'), A('2026-03-03T20:00:00Z'),
  { movie_id: 2, watched_at: '2026-03-04T20:00:00Z', movies: { runtime: 90, mood_tags: ['cozy'], tone_tags: ['warm'], fit_profile: 'easy', director_name: 'E', release_date: '2019-01-01', title: 'B' } }]

function makeQuery(result) {
  const promise = Promise.resolve(result)
  const chain = {
    select: () => chain, eq: () => chain, order: () => chain, limit: () => chain, in: () => chain,
    maybeSingle: () => Promise.resolve({ data: Array.isArray(result.data) ? (result.data[0] ?? null) : (result.data ?? null), error: result.error ?? null }),
    then: (res, rej) => promise.then(res, rej),
    catch: (fn) => promise.catch(fn),
  }
  return chain
}
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    from: (table) => {
      if (table === 'user_history') return makeQuery(historyResult)
      if (table === 'user_profiles_computed') return makeQuery({ data: FRESH_EDITORIAL })
      return makeQuery({ data: [] })
    },
  },
}))

import { useProfileDataFetch } from '../useProfileData'

beforeEach(() => { historyResult = { data: ROWS, error: null } })

describe('useProfileDataFetch — canonical history at the boundary (F7.3)', () => {
  it('visible stats count each film once (3 duplicate rows of A → films logged 2, not 4)', async () => {
    const { result } = renderHook(() => useProfileDataFetch({ userId: 'u1', authUser: { id: 'u1' }, isSelf: true }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.stats.filmsLogged).toBe(2)            // canonical, not 4
    expect(result.current.stats.hoursWatched).toBe(4)           // (120 + 90)/60, not (360 + 90)/60
  })

  it('a failed history query surfaces the safe load_error classification (no raw text)', async () => {
    historyResult = { data: null, error: { message: 'permission denied for table user_history' } }
    const { result } = renderHook(() => useProfileDataFetch({ userId: 'u1', authUser: { id: 'u1' }, isSelf: true }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('load_error')
    expect(result.current.error).not.toMatch(/permission denied/)
    expect(typeof result.current.retry).toBe('function')
  })
})
