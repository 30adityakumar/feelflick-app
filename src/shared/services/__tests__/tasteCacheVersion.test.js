import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PROFILE_EVIDENCE_VERSION } from '@/shared/lib/profileEvidenceVersion'

// F7.6 — the fingerprint cache is valid only when fresh AND version-current. A pre-F7.3
// (unversioned, duplicate-derived) fingerprint is recomputed from canonical history and the
// freshly-computed result carries the current evidence version.

const M = (mood) => ({ mood_tags: [mood], tone_tags: ['t'], fit_profile: 'f' })
const HISTORY = [1, 2, 3, 4, 5].map((id) => ({ movie_id: id, watched_at: `2026-03-0${id}T20:00:00Z`, movies: M(`m${id}`) }))

let cacheRow
let historyReads
function makeBuilder(table) {
  if (table === 'user_history') {
    return { select: () => ({ eq: () => { historyReads++; return Promise.resolve({ data: HISTORY }) } }) }
  }
  return {
    select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: cacheRow }) }) }),
    update: () => ({ eq: () => Promise.resolve({}) }),
    insert: () => Promise.resolve({}),
  }
}
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    from: (t) => makeBuilder(t),
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'someone-else' } } }) }, // not the target → no persist
  },
}))

import { getTasteFingerprint } from '../tasteCache'

const fresh = () => new Date(Date.now() - 60_000).toISOString()
beforeEach(() => { historyReads = 0; cacheRow = null })

describe('getTasteFingerprint — evidence-version cache validity (F7.6)', () => {
  it('a fresh but UNVERSIONED (pre-F7.3) cache is stale → recomputed, and the result is versioned', async () => {
    cacheRow = { taste_fingerprint: { topMoodTags: [{ key: 'old', count: 9, share: 1 }], total: 9 }, taste_fingerprint_computed_at: fresh() }
    const fp = await getTasteFingerprint('target')
    expect(historyReads).toBe(1)                              // recomputed from canonical history
    expect(fp.evidenceVersion).toBe(PROFILE_EVIDENCE_VERSION) // freshly stamped
    expect(fp.total).toBe(5)                                  // canonical count, not the stale 9
  })

  it('a fresh + CURRENT-version cache is reused without recomputing', async () => {
    cacheRow = { taste_fingerprint: { topMoodTags: [{ key: 'cur', count: 5, share: 1 }], total: 5, evidenceVersion: PROFILE_EVIDENCE_VERSION }, taste_fingerprint_computed_at: fresh() }
    const fp = await getTasteFingerprint('target')
    expect(historyReads).toBe(0)                              // cache hit, no recompute
    expect(fp.topMoodTags[0].key).toBe('cur')
  })

  it('a fresh cache with a PREVIOUS version is stale → recomputed', async () => {
    cacheRow = { taste_fingerprint: { topMoodTags: [], total: 5, evidenceVersion: PROFILE_EVIDENCE_VERSION - 1 }, taste_fingerprint_computed_at: fresh() }
    await getTasteFingerprint('target')
    expect(historyReads).toBe(1)
  })

  it('recompute preserves a previously-stored editorialVersion on the same row', async () => {
    cacheRow = { taste_fingerprint: { total: 9, editorialVersion: PROFILE_EVIDENCE_VERSION }, taste_fingerprint_computed_at: fresh() }
    const fp = await getTasteFingerprint('target')
    expect(historyReads).toBe(1)                              // unversioned fingerprint → recompute
    expect(fp.evidenceVersion).toBe(PROFILE_EVIDENCE_VERSION)
    expect(fp.editorialVersion).toBe(PROFILE_EVIDENCE_VERSION) // editorial version not dropped
  })
})
