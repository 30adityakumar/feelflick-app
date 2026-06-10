import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// F7.4 cardinal rule: maturity gates GENERATION, not just rendering. A forming profile must
// never call the editorial Edge Function (preserving cost + the "identity from one film" trust
// problem would otherwise survive a UI-only fix).

vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-test-key')

vi.mock('@/shared/services/tasteCache', () => ({
  getTasteFingerprint: () => Promise.resolve({ topMoodTags: [{ key: 'a', count: 1, share: 1 }], topToneTags: [], topFitProfiles: [], total: 3 }),
}))

let historyRows
let ratingRows
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
      if (table === 'user_history') return makeQuery({ data: historyRows })
      if (table === 'user_ratings') return makeQuery({ data: ratingRows })
      if (table === 'user_profiles_computed') return makeQuery({ data: null })   // missing editorial → regen-eligible
      return makeQuery({ data: [] })
    },
  },
}))

import { useProfileDataFetch } from '../useProfileData'

const film = (id) => ({ movie_id: id, watched_at: `2026-03-${String(id).padStart(2, '0')}T20:00:00Z`, movies: { runtime: 100, mood_tags: ['a'], tone_tags: ['b'], fit_profile: 'c', director_name: 'D', release_date: '2021-01-01', title: `Film ${id}` } })
const films = (n) => Array.from({ length: n }, (_, i) => film(i + 1))

let fetchSpy
beforeEach(() => {
  fetchSpy = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ summary: 's', signature: 'g' }) }))
  vi.stubGlobal('fetch', fetchSpy)
})

describe('useProfileDataFetch — editorial generation maturity gate (F7.4)', () => {
  it('FORMING profile (3 watched / 0 rated) NEVER calls the editorial Edge Function', async () => {
    historyRows = films(3); ratingRows = []
    const { result } = renderHook(() => useProfileDataFetch({ userId: 'u1', authUser: { id: 'u1' }, isSelf: true }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await new Promise(r => setTimeout(r, 0))   // let any (wrongly-fired) regen run
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('F7.6: ESTABLISHED profile with MISSING editorial still makes ZERO calls on render', async () => {
    // F7.6 supersedes F7.4 generation-on-render entirely: even an eligible profile with no
    // editorial never auto-generates. Generation is the explicit refresh action only.
    historyRows = films(15); ratingRows = Array.from({ length: 5 }, (_, i) => ({ movie_id: i + 1, rating: 8 }))
    const { result } = renderHook(() => useProfileDataFetch({ userId: 'u1', authUser: { id: 'u1' }, isSelf: true }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await new Promise(r => setTimeout(r, 0))
    expect(fetchSpy).not.toHaveBeenCalled()
    // the editorial is classified 'none' (missing) → the explicit refresh action is available
    expect(result.current.editorialStatus).toBe('none')
    expect(typeof result.current.refreshEditorial).toBe('function')
  })
})
