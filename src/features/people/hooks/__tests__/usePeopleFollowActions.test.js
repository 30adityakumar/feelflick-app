import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// F8.4 — settled follow/unfollow: no relationship state is confirmed until the DB write succeeds;
// 23505 (already following) is idempotent success; duplicate clicks collapse to one write; self is
// rejected; Hide is session-local and never calls Supabase.

let insertResult, deleteResult, insertPayloads, deleteFilters, insertDelayMs
function makeInsert(payload) {
  insertPayloads.push(payload)
  return new Promise(res => { (insertDelayMs ? setTimeout : (f) => f())(() => res(insertResult), insertDelayMs) })
}
function makeDelete() {
  const filt = {}
  const chain = {
    eq: (col, val) => { filt[col] = val; return chain },
    then: (res, rej) => { deleteFilters.push(filt); return Promise.resolve(deleteResult).then(res, rej) },
  }
  return chain
}
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: () => ({ insert: (p) => makeInsert(p), delete: () => makeDelete() }) },
}))

import { usePeopleFollowActions, nextFocusId } from '../usePeopleFollowActions'

const ME = 'me'
function setup({ followingIds = new Set() } = {}) {
  const applyFollowState = vi.fn()
  const view = renderHook(({ ids }) => usePeopleFollowActions({ userId: ME, followingIds: ids, applyFollowState }), {
    initialProps: { ids: followingIds },
  })
  return { ...view, applyFollowState }
}

beforeEach(() => {
  insertResult = { error: null }; deleteResult = { error: null }
  insertPayloads = []; deleteFilters = []; insertDelayMs = 0
})

describe('F8.4 follow settlement', () => {
  it('success: ONE insert with the exact payload, settled Following + one announcement', async () => {
    const { result, applyFollowState } = setup()
    await act(async () => { await result.current.follow('B', 'Bob') })
    expect(insertPayloads).toEqual([{ follower_id: ME, following_id: 'B' }])      // exact payload preserved
    expect(applyFollowState).toHaveBeenCalledWith('B', true)                      // state flips only on success
    expect(result.current.relStatus).toContain("You're now following Bob.")
    expect(result.current.isPending('B')).toBe(false)
  })

  it('failure: resolved { error } → NOT Following, retry possible, no backend text announced', async () => {
    insertResult = { error: { code: '42501', message: 'permission denied for table user_follows' } }
    const { result, applyFollowState } = setup()
    await act(async () => { await result.current.follow('B', 'Bob') })
    expect(applyFollowState).not.toHaveBeenCalled()
    expect(result.current.relStatus).toContain('Could not follow Bob. Try again.')
    expect(result.current.relStatus).not.toMatch(/permission denied|42501/)
    expect(result.current.isErrored('B')).toBe(true)
    expect(result.current.isPending('B')).toBe(false)
  })

  it('duplicate-key 23505 is idempotent SUCCESS (already following), never a false failure', async () => {
    insertResult = { error: { code: '23505', message: 'duplicate key' } }
    const { result, applyFollowState } = setup()
    await act(async () => { await result.current.follow('B', 'Bob') })
    expect(applyFollowState).toHaveBeenCalledWith('B', true)
    expect(result.current.relStatus).toContain("You're now following Bob.")
    expect(result.current.isErrored('B')).toBe(false)
  })

  it('already-following → no-op (no insert)', async () => {
    const { result } = setup({ followingIds: new Set(['B']) })
    await act(async () => { await result.current.follow('B', 'Bob') })
    expect(insertPayloads).toEqual([])
  })
})

describe('F8.4 unfollow settlement', () => {
  it('success: exact DELETE filters, state flips only after success, one announcement', async () => {
    const { result, applyFollowState } = setup({ followingIds: new Set(['B']) })
    await act(async () => { await result.current.unfollow('B', 'Bob') })
    expect(deleteFilters).toEqual([{ follower_id: ME, following_id: 'B' }])       // exact filters preserved
    expect(applyFollowState).toHaveBeenCalledWith('B', false)
    expect(result.current.relStatus).toContain('You stopped following Bob.')
  })

  it('failure: keeps Following, one failure announcement, no backend text', async () => {
    deleteResult = { error: { code: 'XX', message: 'boom' } }
    const { result, applyFollowState } = setup({ followingIds: new Set(['B']) })
    await act(async () => { await result.current.unfollow('B', 'Bob') })
    expect(applyFollowState).not.toHaveBeenCalled()
    expect(result.current.relStatus).toContain('Could not unfollow Bob. Try again.')
    expect(result.current.relStatus).not.toMatch(/boom/)
  })
})

describe('F8.4 concurrency + self-follow', () => {
  it('rapid duplicate follow clicks → ONE request', async () => {
    insertDelayMs = 20
    const { result } = setup()
    await act(async () => { await Promise.all([result.current.follow('B', 'Bob'), result.current.follow('B', 'Bob'), result.current.follow('B', 'Bob')]) })
    expect(insertPayloads).toHaveLength(1)
  })

  it('a pending request for A does NOT block an action for B', async () => {
    insertDelayMs = 30
    const { result } = setup()
    await act(async () => { await Promise.all([result.current.follow('A', 'Ann'), result.current.follow('B', 'Bob')]) })
    expect(insertPayloads.map(p => p.following_id).sort()).toEqual(['A', 'B'])
  })

  it('self-follow is rejected: zero write, no announcement', async () => {
    const { result, applyFollowState } = setup()
    await act(async () => { await result.current.follow(ME, 'Me') })
    expect(insertPayloads).toEqual([])
    expect(applyFollowState).not.toHaveBeenCalled()
    expect(result.current.relStatus).toBe('')
  })

  it('late completion after unmount does not throw / update state', async () => {
    insertDelayMs = 40
    const { result, unmount } = setup()
    let p
    act(() => { p = result.current.follow('B', 'Bob') })
    unmount()
    await act(async () => { await p })   // resolves after unmount — must be a safe no-op
  })
})

describe('F8.4 Hide suggestion (session-local, not a block)', () => {
  it('hides only the selected id, announces, and calls NO Supabase write', async () => {
    const { result } = setup()
    act(() => { result.current.hideSuggestion('B') })
    expect(result.current.isHidden('B')).toBe(true)
    expect(result.current.isHidden('C')).toBe(false)
    expect(result.current.relStatus).toContain('Hidden from your suggestions.')
    expect(insertPayloads).toEqual([])
    expect(deleteFilters).toEqual([])
  })
})

describe('F8.4 nextFocusId (focus-after-removal)', () => {
  it('prefers next, then previous, then null', () => {
    expect(nextFocusId(['a', 'b', 'c'], 'a')).toBe('b')
    expect(nextFocusId(['a', 'b', 'c'], 'c')).toBe('b')   // last → previous
    expect(nextFocusId(['a'], 'a')).toBeNull()            // only → null (fallback)
    expect(nextFocusId(['a', 'b'], 'z')).toBeNull()       // not present
    expect(nextFocusId(null, 'a')).toBeNull()
  })
})

// keep waitFor imported for parity with the suite's async style
void waitFor
