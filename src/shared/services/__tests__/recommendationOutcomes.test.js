import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- mocks -----------------------------------------------------------------
// The helper reads the latest impression (supabase) then writes via updateImpression.
const maybeSingle = vi.fn()
const order = vi.fn(() => ({ limit: () => ({ maybeSingle }) }))
const eq2 = vi.fn(() => ({ order }))
const eq1 = vi.fn(() => ({ eq: eq2 }))
const select = vi.fn(() => ({ eq: eq1 }))
const from = vi.fn(() => ({ select }))

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: (...a) => from(...a) },
}))

const updateImpression = vi.fn().mockResolvedValue(undefined)
vi.mock('../recommendations', () => ({
  updateImpression: (...a) => updateImpression(...a),
}))

import {
  recordRecommendationOutcome,
  OUTCOME_ATTRIBUTION_WINDOW_HOURS,
  ATTRIBUTABLE_ACTIONS,
} from '../recommendationOutcomes'

const hoursAgo = (h) => new Date(Date.now() - h * 3_600_000).toISOString()

// F8B contract: an action is attributed to a recommendation ONLY when the user
// was shown that film by the engine RECENTLY. Generic/direct actions (no recent
// impression) must NOT flip an impression flag — they stay generic writes.
describe('recordRecommendationOutcome', () => {
  beforeEach(() => {
    maybeSingle.mockReset()
    updateImpression.mockClear()
    from.mockClear(); select.mockClear(); eq1.mockClear(); eq2.mockClear(); order.mockClear()
  })

  it('attributes when a RECENT impression exists', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'imp-1', shown_at: hoursAgo(1) } })
    const res = await recordRecommendationOutcome({ userId: 'u1', movieId: 101, action: 'saved' })
    expect(res).toEqual({ attributed: true, reason: 'attributed' })
    expect(updateImpression).toHaveBeenCalledWith('u1', 101, 'saved')
  })

  it('does NOT attribute when there is NO impression (generic/direct action)', async () => {
    maybeSingle.mockResolvedValue({ data: null })
    const res = await recordRecommendationOutcome({ userId: 'u1', movieId: 999, action: 'saved' })
    expect(res).toEqual({ attributed: false, reason: 'no-impression' })
    expect(updateImpression).not.toHaveBeenCalled()
  })

  it('does NOT attribute when the impression is STALE (older than the window)', async () => {
    maybeSingle.mockResolvedValue({
      data: { id: 'imp-old', shown_at: hoursAgo(OUTCOME_ATTRIBUTION_WINDOW_HOURS + 5) },
    })
    const res = await recordRecommendationOutcome({ userId: 'u1', movieId: 101, action: 'watched' })
    expect(res).toEqual({ attributed: false, reason: 'stale-impression' })
    expect(updateImpression).not.toHaveBeenCalled()
  })

  it('attributes right up to the window edge', async () => {
    maybeSingle.mockResolvedValue({
      data: { id: 'imp-edge', shown_at: hoursAgo(OUTCOME_ATTRIBUTION_WINDOW_HOURS - 1) },
    })
    const res = await recordRecommendationOutcome({ userId: 'u1', movieId: 101, action: 'clicked' })
    expect(res.attributed).toBe(true)
    expect(updateImpression).toHaveBeenCalledWith('u1', 101, 'clicked')
  })

  it('rejects invalid args without touching the DB', async () => {
    expect(await recordRecommendationOutcome({ userId: null, movieId: 1, action: 'saved' }))
      .toEqual({ attributed: false, reason: 'invalid-args' })
    expect(await recordRecommendationOutcome({ userId: 'u1', movieId: null, action: 'saved' }))
      .toEqual({ attributed: false, reason: 'invalid-args' })
    expect(await recordRecommendationOutcome({ userId: 'u1', movieId: 1, action: 'rated' }))
      .toEqual({ attributed: false, reason: 'invalid-args' })
    expect(from).not.toHaveBeenCalled()
    expect(updateImpression).not.toHaveBeenCalled()
  })

  it('never throws if the read fails — returns error, no UI impact', async () => {
    maybeSingle.mockRejectedValue(new Error('network'))
    const res = await recordRecommendationOutcome({ userId: 'u1', movieId: 101, action: 'saved' })
    expect(res).toEqual({ attributed: false, reason: 'error' })
    expect(updateImpression).not.toHaveBeenCalled()
  })

  it('is idempotent at the write layer (boolean flag — no double count)', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'imp-1', shown_at: hoursAgo(1) } })
    await recordRecommendationOutcome({ userId: 'u1', movieId: 101, action: 'saved' })
    await recordRecommendationOutcome({ userId: 'u1', movieId: 101, action: 'saved' })
    // updateImpression sets a boolean flag = true; calling twice is safe.
    expect(updateImpression).toHaveBeenCalledTimes(2)
    expect(updateImpression).toHaveBeenLastCalledWith('u1', 101, 'saved')
  })

  it('only knows the four impression-flag actions', () => {
    expect([...ATTRIBUTABLE_ACTIONS].sort()).toEqual(['clicked', 'saved', 'skipped', 'watched'])
  })
})
