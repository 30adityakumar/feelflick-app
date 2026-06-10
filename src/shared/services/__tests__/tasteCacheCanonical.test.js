import { describe, it, expect, vi, beforeEach } from 'vitest'

// F7.3 — the taste fingerprint must aggregate from CANONICAL history (one row per film),
// so duplicate watch events don't multiply a film's mood/tone/fit weight or inflate `total`.
// Fixture: 5 distinct films (so MIN_FILMS_FOR_FINGERPRINT=5 is met by canonical count) where
// film 1 (unique mood 'tender') is logged 4× via different paths. 'tender' must count ONCE.

const M = (mood, tone, fit) => ({ mood_tags: [mood], tone_tags: [tone], fit_profile: fit })
const r = (movie_id, watched_at, movies) => ({ movie_id, watched_at, movies })
const HISTORY = [
  r(1, '2026-03-01T20:00:00Z', M('tender', 'quiet', 'slow')),   // film 1 ×4 (duplicates)
  r(1, '2026-03-02T20:00:00Z', M('tender', 'quiet', 'slow')),
  r(1, '2026-03-03T20:00:00Z', M('tender', 'quiet', 'slow')),
  r(1, '2026-03-04T20:00:00Z', M('tender', 'quiet', 'slow')),
  r(2, '2026-03-05T20:00:00Z', M('cozy', 'warm', 'easy')),
  r(3, '2026-03-06T20:00:00Z', M('tense', 'cold', 'hard')),
  r(4, '2026-03-07T20:00:00Z', M('bright', 'light', 'fun')),
  r(5, '2026-03-08T20:00:00Z', M('bleak', 'grey', 'heavy')),
]

const updateSpy = vi.fn()
const insertSpy = vi.fn()
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    from: (table) => {
      if (table === 'user_history') {
        return { select: () => ({ eq: () => Promise.resolve({ data: HISTORY }) }) }
      }
      // user_profiles_computed — cache miss + write spies
      return {
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }),
        update: (...a) => { updateSpy(...a); return { eq: () => Promise.resolve({}) } },
        insert: (...a) => { insertSpy(...a); return Promise.resolve({}) },
      }
    },
    // viewer is NOT the target user → fingerprint must not persist (owner-gated write)
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'someone-else' } } }) },
  },
}))

import { getTasteFingerprint } from '../tasteCache'

beforeEach(() => { updateSpy.mockClear(); insertSpy.mockClear() })

describe('getTasteFingerprint — canonical evidence (F7.3)', () => {
  it('aggregates from one-row-per-film: the duplicated mood counts once and total is the film count', async () => {
    const fp = await getTasteFingerprint('target-user')
    expect(fp).not.toBeNull()
    expect(fp.total).toBe(5)                                    // 5 distinct films, not 8 rows
    const tender = fp.topMoodTags.find(t => t.key === 'tender')
    expect(tender.count).toBe(1)                                // not 4 (the duplicates)
    expect(tender.share).toBeCloseTo(1 / 5)                     // denominator is canonical film count
  })

  it('stays owner-gated: computing another user\'s fingerprint writes nothing', async () => {
    await getTasteFingerprint('target-user')
    expect(updateSpy).not.toHaveBeenCalled()
    expect(insertSpy).not.toHaveBeenCalled()
  })
})
