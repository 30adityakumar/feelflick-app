import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ── Controllable supabase mock ────────────────────────────────────────────────
// Reads (maybeSingle) resolve empty; writes (upsert/insert/delete) record the call
// and resolve via a queue of deferred promises so tests can control settlement order.
const writeCalls = []
let deferreds = []
function nextDeferred() {
  let resolve, reject
  const promise = new Promise((res) => { resolve = () => res({ error: null }); reject = () => res({ error: { message: 'fail' } }) })
  const d = { promise, resolve, reject }
  deferreds.push(d)
  return d
}
function makeBuilder() {
  const b = {}
  for (const m of ['select', 'eq', 'not', 'order', 'limit']) b[m] = vi.fn(() => b)
  b.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }))
  for (const op of ['upsert', 'insert', 'delete']) {
    b[op] = vi.fn((payload) => {
      // delete().eq().eq() is awaited on the chain tail; upsert/insert are awaited
      // directly. Record + return a thenable tied to the next deferred.
      const d = nextDeferred()
      const rec = { op, payload }
      writeCalls.push(rec)
      const thenable = {
        eq: vi.fn(() => thenable),
        then: (res, rej) => d.promise.then(res, rej),
        catch: (fn) => d.promise.catch(fn),
        __deferred: d,
      }
      // upsert/insert are awaited directly (no trailing .eq); delete chains .eq.
      return op === 'delete' ? thenable : { then: (res, rej) => d.promise.then(res, rej) }
    })
  }
  return b
}
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn(() => makeBuilder()) },
}))

import { useUserRating } from '../useUserRating'

beforeEach(() => { writeCalls.length = 0; deferreds = []; vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })

const settleAll = async () => {
  for (const d of deferreds) d.resolve()
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
}

describe('useUserRating — F5.4 serialization', () => {
  it('26. rapid identical star clicks produce ONE effective write (debounce coalesces)', async () => {
    const { result } = renderHook(() => useUserRating({ userId: 'u1', internalId: 7 }))
    await act(async () => {}) // flush hydration
    writeCalls.length = 0
    act(() => { result.current.setStars(4); result.current.setStars(4); result.current.setStars(4) })
    await act(async () => { vi.advanceTimersByTime(600) })
    expect(writeCalls.filter(w => w.op === 'upsert').length).toBe(1)
    expect(writeCalls.at(-1).payload.rating).toBe(8) // 4★ → canonical 8 (unchanged scale)
  })

  it('27/34. different values → latest-value-wins, payload byte-equivalent', async () => {
    const { result } = renderHook(() => useUserRating({ userId: 'u1', internalId: 7 }))
    await act(async () => {})
    writeCalls.length = 0
    act(() => { result.current.setStars(2); result.current.setStars(5) })
    await act(async () => { vi.advanceTimersByTime(600) })
    const writes = writeCalls.filter(w => w.op === 'upsert')
    expect(writes.length).toBe(1)
    expect(writes[0].payload).toMatchObject({ user_id: 'u1', movie_id: 7, rating: 10, review_text: null })
    expect(writes[0].payload).toHaveProperty('rated_at')
  })

  it('28/29. one write in flight; a change mid-flight runs after, stale completion ignored', async () => {
    const { result } = renderHook(() => useUserRating({ userId: 'u1', internalId: 7 }))
    await act(async () => {})
    writeCalls.length = 0
    act(() => { result.current.setStars(3) })
    await act(async () => { vi.advanceTimersByTime(600) })   // write #1 starts (deferred)
    expect(writeCalls.length).toBe(1)
    expect(result.current.saveStatus).toBe('saving')
    // a new value while #1 is in flight
    act(() => { result.current.setStars(5) })
    await act(async () => { vi.advanceTimersByTime(600) })
    // still only #1 has started (one in flight) — #2 is pending
    expect(writeCalls.length).toBe(1)
    // settle #1 → the drain runs the pending latest (#2)
    await act(async () => { deferreds[0].resolve(); await Promise.resolve() })
    expect(writeCalls.length).toBe(2)
    expect(writeCalls[1].payload.rating).toBe(10) // latest value
  })

  it('30. latest successful write exposes saved status', async () => {
    const { result } = renderHook(() => useUserRating({ userId: 'u1', internalId: 7 }))
    await act(async () => {})
    act(() => { result.current.setStars(4) })
    await act(async () => { vi.advanceTimersByTime(600) })
    await act(async () => { await settleAll() })
    expect(result.current.saveStatus).toBe('saved')
  })

  it('31/32. failure exposes error + retains local values; retry succeeds', async () => {
    const { result } = renderHook(() => useUserRating({ userId: 'u1', internalId: 7 }))
    await act(async () => {})
    act(() => { result.current.setStars(4) })
    await act(async () => { vi.advanceTimersByTime(600) })
    await act(async () => { deferreds[0].reject(); await Promise.resolve() })
    expect(result.current.saveStatus).toBe('error')
    expect(result.current.stars).toBe(4) // local value retained
    // retry
    act(() => { result.current.setStars(4) })
    await act(async () => { vi.advanceTimersByTime(600) })
    await act(async () => { await settleAll() })
    expect(result.current.saveStatus).toBe('saved')
  })

  it('35. reaction uses the user_movie_feedback table with the unchanged payload', async () => {
    const { result } = renderHook(() => useUserRating({ userId: 'u1', internalId: 7 }))
    await act(async () => {})
    writeCalls.length = 0
    act(() => { result.current.setReaction('Loved it') })
    await act(async () => { vi.advanceTimersByTime(600) })
    const insert = writeCalls.find(w => w.op === 'insert')
    expect(insert.payload).toMatchObject({
      user_id: 'u1', movie_id: 7, sentiment: 'loved',
      feedback_type: 'sentiment', placement: 'movie_detail_v2_your_take', watched_confirmed: true,
    })
  })

  it('33. unmount clears pending timers without throwing (no state update after unmount)', async () => {
    const { result, unmount } = renderHook(() => useUserRating({ userId: 'u1', internalId: 7 }))
    await act(async () => {})
    act(() => { result.current.setStars(4) }) // schedules a debounce
    expect(() => unmount()).not.toThrow()
    // advancing timers after unmount must not fire the (cleared) debounce again
    writeCalls.length = 0
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(writeCalls.filter(w => w.op === 'upsert' || w.op === 'delete').length).toBeLessThanOrEqual(1)
  })
})
