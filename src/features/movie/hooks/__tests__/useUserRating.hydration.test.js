import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Controllable read mock: maybeSingle() resolves with the per-table result in `reads`.
// (vi.mock factory may only reference hoisted function declarations, so it calls
// makeBuilder, which reads the module-level `reads` lazily at call time.)
let reads
function makeBuilder(table) {
  const b = {}
  for (const m of ['select', 'eq', 'not', 'order', 'limit']) b[m] = vi.fn(() => b)
  b.maybeSingle = vi.fn(() => Promise.resolve(reads[table]))
  for (const op of ['upsert', 'insert', 'delete']) {
    const tail = { eq: vi.fn(() => tail), then: (r) => Promise.resolve({ error: null }).then(r) }
    b[op] = vi.fn(() => tail)
  }
  return b
}
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn((t) => makeBuilder(t)) },
}))

import { useUserRating } from '../useUserRating'

beforeEach(() => {
  reads = {
    user_ratings: { data: null, error: null },
    user_movie_feedback: { data: null, error: null },
  }
})
afterEach(() => vi.clearAllMocks())

describe('useUserRating — hydration hardening (§21)', () => {
  it('hydrates rating + reaction from existing data', async () => {
    reads.user_ratings = { data: { rating: 8, review_text: 'great' }, error: null }
    reads.user_movie_feedback = { data: { sentiment: 'loved', created_at: 'x' }, error: null }
    const { result } = renderHook(() => useUserRating({ userId: 'u1', internalId: 7 }))
    await act(async () => {})
    expect(result.current.hydrated).toBe(true)
    expect(result.current.loadError).toBe(false)
    expect(result.current.stars).toBe(8)
    expect(result.current.reviewText).toBe('great')
    expect(result.current.reaction).toBe('Loved it')
  })

  it('a FEEDBACK read error surfaces loadError (not silently "no reaction")', async () => {
    reads.user_movie_feedback = { data: null, error: { message: 'boom' } }
    const { result } = renderHook(() => useUserRating({ userId: 'u1', internalId: 7 }))
    await act(async () => {})
    expect(result.current.loadError).toBe(true)
    expect(result.current.hydrated).toBe(true)
  })

  it('a RATING read error surfaces loadError', async () => {
    reads.user_ratings = { data: null, error: { message: 'boom' } }
    const { result } = renderHook(() => useUserRating({ userId: 'u1', internalId: 7 }))
    await act(async () => {})
    expect(result.current.loadError).toBe(true)
  })

  it('retryHydrate clears the error and re-reads successfully', async () => {
    reads.user_ratings = { data: null, error: { message: 'boom' } }
    const { result } = renderHook(() => useUserRating({ userId: 'u1', internalId: 7 }))
    await act(async () => {})
    expect(result.current.loadError).toBe(true)
    reads.user_ratings = { data: { rating: 6, review_text: null }, error: null }
    await act(async () => { result.current.retryHydrate() })
    await act(async () => {})
    expect(result.current.loadError).toBe(false)
    expect(result.current.stars).toBe(6)
  })

  it('changing the (user, movie) pair RESETS the form before re-hydrating (no stale carryover)', async () => {
    reads.user_ratings = { data: { rating: 10, review_text: 'film one note' }, error: null }
    const { result, rerender } = renderHook(({ id }) => useUserRating({ userId: 'u1', internalId: id }), { initialProps: { id: 7 } })
    await act(async () => {})
    expect(result.current.stars).toBe(10)
    expect(result.current.reviewText).toBe('film one note')
    // switch to a new film whose read returns empty — the previous note must NOT persist
    reads.user_ratings = { data: null, error: null }
    rerender({ id: 99 })
    // synchronously after the pair change, the form is reset (before the async read resolves)
    expect(result.current.stars).toBe(0)
    expect(result.current.reviewText).toBe('')
    expect(result.current.reaction).toBe('')
    await act(async () => {})
    expect(result.current.stars).toBe(0)
    expect(result.current.loadError).toBe(false)
  })

  it('switching account (userId) also resets', async () => {
    reads.user_ratings = { data: { rating: 8, review_text: 'mine' }, error: null }
    const { result, rerender } = renderHook(({ uid }) => useUserRating({ userId: uid, internalId: 7 }), { initialProps: { uid: 'u1' } })
    await act(async () => {})
    expect(result.current.reviewText).toBe('mine')
    reads.user_ratings = { data: null, error: null }
    rerender({ uid: 'u2' })
    expect(result.current.reviewText).toBe('')
    await act(async () => {})
    expect(result.current.reviewText).toBe('')
  })
})
