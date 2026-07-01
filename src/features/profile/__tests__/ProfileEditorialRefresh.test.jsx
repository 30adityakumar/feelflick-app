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
let writeError = null   // F7.9: simulate an editorial cache-write {error} (Edge OK, persistence fails)
function makeQuery(result) {
  const p = Promise.resolve(result)
  const chain = {
    select: () => chain, eq: () => chain, order: () => chain, limit: () => chain, in: () => chain,
    maybeSingle: () => Promise.resolve({ data: result.data, error: null }),
    update: () => { writes++; return { eq: () => Promise.resolve({ error: writeError }) } },
    insert: () => { writes++; return Promise.resolve({ error: writeError }) },
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
    // The hardened edge function verifies the real user JWT → regenerateEditorial reads the session.
    auth: { getSession: () => Promise.resolve({ data: { session: { access_token: 'tok-test' } } }) },
  },
}))

import { useProfileDataFetch } from '../useProfileData'
import { computeMaterialSignature } from '../editorialSignature'

// The fingerprint the mock returns → its material signature (used to build stale/fresh fixtures).
const LIVE_SIG = computeMaterialSignature({ topMoodTags: [{ key: 'a', count: 1, share: 1 }], topToneTags: [], topFitProfiles: [] })
const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString()

const CURRENT_EDITORIAL = { user_id: 'u1', editorial_summary: 'cached summary', editorial_signature: 'cached sig', editorial_archetype: ['a', 'b', 'c'], editorial_generated_at: '2999-01-01T00:00:00Z', taste_fingerprint: {} }

let fetchSpy
beforeEach(() => {
  fetchOk = true; writes = 0; writeError = null
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

// F7.9 — an Edge success followed by a cache-WRITE failure must NOT announce durable success.
describe('F7.9 — editorial cache-write failure settles honestly', () => {
  it('UPDATE path write error → status error, NOT current; prior reflection preserved; retryable', async () => {
    fpEditorialVersion = 2; editorialRow = CURRENT_EDITORIAL   // existing row → UPDATE path; starts 'current'
    const { result } = mountSelf()
    await waitFor(() => expect(result.current.loading).toBe(false))
    writeError = { code: 'MOCK', message: 'mock write failure' }
    await act(async () => { await result.current.refreshEditorial() })
    expect(fetchSpy).toHaveBeenCalledTimes(1)          // Edge DID succeed
    expect(writes).toBe(1)                              // a write was attempted
    expect(result.current.refreshStatus).toBe('error') // settled to error, not success
    expect(result.current.editorial.summary).toBe('cached summary') // prior reflection intact
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('INSERT path write error → status error, NOT current; no partial reflection becomes current', async () => {
    fpEditorialVersion = undefined; editorialRow = null    // no existing row → INSERT path; starts 'none'
    const { result } = mountSelf()
    await waitFor(() => expect(result.current.loading).toBe(false))
    writeError = { code: 'MOCK', message: 'mock insert failure' }
    await act(async () => { await result.current.refreshEditorial() })
    expect(result.current.refreshStatus).toBe('error')
    expect(result.current.editorialStatus).not.toBe('current')   // no false current
    expect(result.current.editorial.summary).toBeFalsy()         // the fresh summary did NOT become current
  })

  it('retry after a write failure can persist successfully', async () => {
    fpEditorialVersion = undefined; editorialRow = null
    const { result } = mountSelf()
    await waitFor(() => expect(result.current.loading).toBe(false))
    writeError = { code: 'MOCK', message: 'transient' }
    await act(async () => { await result.current.refreshEditorial() })
    expect(result.current.refreshStatus).toBe('error')
    writeError = null                                  // the transient failure clears
    await act(async () => { await result.current.refreshEditorial() })
    expect(result.current.refreshStatus).toBe('success')
    expect(result.current.editorialStatus).toBe('current')
    expect(result.current.editorial.summary).toBe('fresh summary')
  })
})

// "Living DNA" auto-refresh — a NEW automatic edge call, gated by the default-OFF profileAutoRefresh
// flag AND a material-change signal AND a courtesy cooldown. OFF (the default) changes nothing.
describe('living-DNA auto-refresh (flag-gated, material-change only)', () => {
  const STALE_ROW = { user_id: 'u1', editorial_summary: 'cached', editorial_signature: 'sig', editorial_archetype: ['a', 'b', 'c'], taste_fingerprint: {}, editorial_material_sig: 'DIFFERENT-OLD-SIG' }
  beforeEach(() => { fpEditorialVersion = 2 })
  afterEach(() => { vi.stubEnv('VITE_ENABLE_PROFILE_AUTO_REFRESH', '') })

  it('flag OFF → hardened pipeline inert: ZERO edge calls on mount (F7.6 preserved)', async () => {
    // With the flag OFF the client doesn't even SELECT the material-sig column in production, so the
    // pipeline can't fire. The safety contract is simply: no automatic edge call.
    editorialRow = { ...STALE_ROW, editorial_generated_at: hoursAgo(3) }
    const { result } = mountSelf()
    await waitFor(() => expect(result.current.loading).toBe(false))
    await new Promise(r => setTimeout(r, 0))
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('flag ON + materially changed + outside cooldown → exactly ONE call; success clears the flag', async () => {
    vi.stubEnv('VITE_ENABLE_PROFILE_AUTO_REFRESH', 'true')
    editorialRow = { ...STALE_ROW, editorial_generated_at: hoursAgo(3) }
    const { result } = mountSelf()
    await waitFor(() => expect(result.current.refreshStatus).toBe('success'))
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(result.current.editorialStatus).toBe('current')
    expect(result.current.editorialMaterialStale).toBe(false)
  })

  it('flag ON + signature MATCHES (no material change) → ZERO calls', async () => {
    vi.stubEnv('VITE_ENABLE_PROFILE_AUTO_REFRESH', 'true')
    editorialRow = { ...STALE_ROW, editorial_material_sig: LIVE_SIG, editorial_generated_at: hoursAgo(3) }
    const { result } = mountSelf()
    await waitFor(() => expect(result.current.loading).toBe(false))
    await new Promise(r => setTimeout(r, 0))
    expect(result.current.editorialStatus).toBe('current')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('flag ON + materially changed but WITHIN the courtesy cooldown → ZERO calls', async () => {
    vi.stubEnv('VITE_ENABLE_PROFILE_AUTO_REFRESH', 'true')
    editorialRow = { ...STALE_ROW, editorial_generated_at: hoursAgo(0.25) }
    const { result } = mountSelf()
    await waitFor(() => expect(result.current.loading).toBe(false))
    await new Promise(r => setTimeout(r, 0))
    expect(result.current.editorialMaterialStale).toBe(true)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('flag ON + non-self view → ZERO calls', async () => {
    vi.stubEnv('VITE_ENABLE_PROFILE_AUTO_REFRESH', 'true')
    editorialRow = { ...STALE_ROW, editorial_generated_at: hoursAgo(3) }
    const { result } = renderHook(() => useProfileDataFetch({ userId: 'u1', authUser: VIEWER, isSelf: false }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await new Promise(r => setTimeout(r, 0))
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('flag ON + auto-refresh FAILS → prior reflection preserved, not falsely current', async () => {
    vi.stubEnv('VITE_ENABLE_PROFILE_AUTO_REFRESH', 'true')
    fetchOk = false
    editorialRow = { ...STALE_ROW, editorial_generated_at: hoursAgo(3) }
    const { result } = mountSelf()
    await waitFor(() => expect(result.current.refreshStatus).toBe('error'))
    expect(result.current.editorial.summary).toBe('cached')
    expect(result.current.editorialStatus).not.toBe('current')
  })
})

// First-ever generation is a SEPARATE trigger from staleness above — there is no prior signature to
// compare against, so it needs its own gate: a percentage rollout, default 0%/off, independent of
// the profileAutoRefresh flag being on.
describe('living-DNA auto-refresh — first-ever generation (rollout-gated)', () => {
  beforeEach(() => { fpEditorialVersion = undefined; editorialRow = null }) // never generated → status 'none'
  afterEach(() => {
    vi.stubEnv('VITE_ENABLE_PROFILE_AUTO_REFRESH', '')
    vi.stubEnv('VITE_PROFILE_AUTO_GEN_ROLLOUT_PCT', '')
  })

  it('flag ON + rollout 0% (default) → ZERO calls even though status is none', async () => {
    vi.stubEnv('VITE_ENABLE_PROFILE_AUTO_REFRESH', 'true')
    const { result } = mountSelf()
    await waitFor(() => expect(result.current.loading).toBe(false))
    await new Promise(r => setTimeout(r, 0))
    expect(result.current.editorialStatus).toBe('none')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('flag ON + rollout 100% → exactly ONE call; success → status current', async () => {
    vi.stubEnv('VITE_ENABLE_PROFILE_AUTO_REFRESH', 'true')
    vi.stubEnv('VITE_PROFILE_AUTO_GEN_ROLLOUT_PCT', '100')
    const { result } = mountSelf()
    await waitFor(() => expect(result.current.refreshStatus).toBe('success'))
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(result.current.editorialStatus).toBe('current')
  })

  it('rollout 100% but flag OFF → ZERO calls (profileAutoRefresh remains the master gate)', async () => {
    vi.stubEnv('VITE_PROFILE_AUTO_GEN_ROLLOUT_PCT', '100')
    const { result } = mountSelf()
    await waitFor(() => expect(result.current.loading).toBe(false))
    await new Promise(r => setTimeout(r, 0))
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rollout 100% + non-self view → ZERO calls', async () => {
    vi.stubEnv('VITE_ENABLE_PROFILE_AUTO_REFRESH', 'true')
    vi.stubEnv('VITE_PROFILE_AUTO_GEN_ROLLOUT_PCT', '100')
    const { result } = renderHook(() => useProfileDataFetch({ userId: 'u1', authUser: VIEWER, isSelf: false }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await new Promise(r => setTimeout(r, 0))
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  // The FORMING maturity gate on this same code path is already covered against a real variable
  // watched/rated-count mock in ProfileEditorialGate.test.jsx (F7.4) — this file's mock returns a
  // fixed 15-watched/5-rated history regardless of userId, so it cannot exercise a FORMING profile.
})
