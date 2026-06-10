import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// F7.6 cardinal contract: mounting/rerendering /profile makes ZERO editorial Edge Function calls
// and ZERO cache writes for ANY editorial state. Generation happens ONLY via the explicit
// refreshEditorial() action.

vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-test-key')

let fpEditorialVersion          // taste_fingerprint.editorialVersion the (mocked) fingerprint carries
vi.mock('@/shared/services/tasteCache', () => ({
  getTasteFingerprint: () => Promise.resolve({ topMoodTags: [{ key: 'a', count: 1, share: 1 }], topToneTags: [], topFitProfiles: [], total: 15, evidenceVersion: 2, editorialVersion: fpEditorialVersion }),
}))

let editorialRow                // user_profiles_computed editorial read
let fetchOk
const film = (id) => ({ movie_id: id, watched_at: `2026-03-${String(id).padStart(2, '0')}T20:00:00Z`, movies: { runtime: 100, mood_tags: ['a'], tone_tags: ['b'], fit_profile: 'c', director_name: 'D', release_date: '2021-01-01', title: `Film ${id}` } })
const films = (n) => Array.from({ length: n }, (_, i) => film(i + 1))
const ratings = (n) => Array.from({ length: n }, (_, i) => ({ movie_id: i + 1, rating: 8 }))

let writes
function makeQuery(result) {
  const p = Promise.resolve(result)
  const chain = {
    select: () => chain, eq: () => chain, order: () => chain, limit: () => chain, in: () => chain,
    maybeSingle: () => Promise.resolve({ data: result.data, error: null }),
    update: () => { writes++; return { eq: () => Promise.resolve({ error: null }) } },
    insert: () => { writes++; return Promise.resolve({ error: null }) },
    then: (res, rej) => p.then(res, rej), catch: (fn) => p.catch(fn),
  }
  return chain
}
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    from: (table) => {
      if (table === 'user_history') return makeQuery({ data: films(15) })
      if (table === 'user_ratings') return makeQuery({ data: ratings(5) })
      if (table === 'user_profiles_computed') return makeQuery({ data: editorialRow })
      return makeQuery({ data: [] })
    },
  },
}))

import { useProfileDataFetch } from '../useProfileData'

const CURRENT_EDITORIAL = { user_id: 'u1', editorial_summary: 'cached summary', editorial_signature: 'cached sig', editorial_archetype: ['a', 'b', 'c'], editorial_generated_at: '2999-01-01T00:00:00Z', taste_fingerprint: {} }

let fetchSpy
beforeEach(() => {
  fetchOk = true; writes = 0
  fetchSpy = vi.fn(() => Promise.resolve({ ok: fetchOk, json: () => Promise.resolve({ summary: 'fresh summary', signature: 'fresh sig' }) }))
  vi.stubGlobal('fetch', fetchSpy)
})
// Stable auth references — an inline object would change every render and re-fire the fetch effect.
const AUTH = { id: 'u1' }
const VIEWER = { id: 'viewer' }
const mountSelf = () => renderHook(() => useProfileDataFetch({ userId: 'u1', authUser: AUTH, isSelf: true }))

describe('F7.6 — zero editorial generation on render', () => {
  it('CURRENT editorial → status current, ZERO Edge calls on mount + rerender', async () => {
    fpEditorialVersion = 2; editorialRow = CURRENT_EDITORIAL
    const { result, rerender } = mountSelf()
    await waitFor(() => expect(result.current.loading).toBe(false))
    rerender()
    await new Promise(r => setTimeout(r, 0))
    expect(result.current.editorialStatus).toBe('current')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(writes).toBe(0)
  })

  it('STALE editorial (version mismatch) → status stale, ZERO Edge calls on render', async () => {
    fpEditorialVersion = 1; editorialRow = CURRENT_EDITORIAL   // editorial present but fingerprint.editorialVersion stale
    const { result } = mountSelf()
    await waitFor(() => expect(result.current.loading).toBe(false))
    await new Promise(r => setTimeout(r, 0))
    expect(result.current.editorialStatus).toBe('stale')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(writes).toBe(0)
  })

  it('MISSING editorial → status none, ZERO Edge calls on render', async () => {
    fpEditorialVersion = undefined; editorialRow = null
    const { result } = mountSelf()
    await waitFor(() => expect(result.current.loading).toBe(false))
    await new Promise(r => setTimeout(r, 0))
    expect(result.current.editorialStatus).toBe('none')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(writes).toBe(0)
  })
})

describe('F7.6 — explicit refresh action', () => {
  it('one refresh() → exactly one Edge call; success → status current', async () => {
    fpEditorialVersion = undefined; editorialRow = null
    const { result } = mountSelf()
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.refreshEditorial() })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(String(fetchSpy.mock.calls[0][0])).toMatch(/generate-taste-summary/)
    expect(result.current.refreshStatus).toBe('success')
    expect(result.current.editorialStatus).toBe('current')
    expect(result.current.editorial.summary).toBe('fresh summary')
  })

  it('duplicate concurrent refresh() collapses to ONE Edge call', async () => {
    fpEditorialVersion = undefined; editorialRow = null
    const { result } = mountSelf()
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await Promise.all([result.current.refreshEditorial(), result.current.refreshEditorial()]) })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('failure → status error, prior editorial preserved, no raw text; retry can succeed', async () => {
    fpEditorialVersion = 2; editorialRow = CURRENT_EDITORIAL
    const { result } = mountSelf()
    await waitFor(() => expect(result.current.loading).toBe(false))
    fetchOk = false
    await act(async () => { await result.current.refreshEditorial() })
    expect(result.current.refreshStatus).toBe('error')
    expect(result.current.editorial.summary).toBe('cached summary')   // prior reflection intact
    fetchOk = true
    await act(async () => { await result.current.refreshEditorial() })
    expect(result.current.refreshStatus).toBe('success')
    expect(result.current.editorial.summary).toBe('fresh summary')
  })

  it('non-self view: refresh() is a no-op (zero Edge calls)', async () => {
    fpEditorialVersion = undefined; editorialRow = null
    const { result } = renderHook(() => useProfileDataFetch({ userId: 'u1', authUser: VIEWER, isSelf: false }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.refreshEditorial() })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
