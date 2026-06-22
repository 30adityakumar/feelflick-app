import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Settled follow/unfollow: no relationship state is confirmed until the DB write succeeds; 23505
// (already following) is idempotent success; duplicate clicks collapse to one write; self is
// rejected. Announcements go through the provider's shared `announce` (passed in). Hide + Undo +
// focus-after-removal live in usePeopleHideActions.

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

import { usePeopleFollowActions } from '../usePeopleFollowActions'
import { usePeopleHideActions, nextFocusId } from '../usePeopleHideActions'

const ME = 'me'
function setup({ followingIds = new Set() } = {}) {
  const applyFollowState = vi.fn()
  const announce = vi.fn()
  const view = renderHook(({ ids }) => usePeopleFollowActions({ userId: ME, followingIds: ids, applyFollowState, announce }), {
    initialProps: { ids: followingIds },
  })
  return { ...view, applyFollowState, announce }
}
const said = (announce, re) => announce.mock.calls.some(([m]) => re.test(m))

beforeEach(() => {
  insertResult = { error: null }; deleteResult = { error: null }
  insertPayloads = []; deleteFilters = []; insertDelayMs = 0
})

describe('follow settlement', () => {
  it('success: ONE insert with the exact payload, settled Following + one announcement', async () => {
    const { result, applyFollowState, announce } = setup()
    await act(async () => { await result.current.follow('B', 'Bob') })
    expect(insertPayloads).toEqual([{ follower_id: ME, following_id: 'B' }])
    expect(applyFollowState).toHaveBeenCalledWith('B', true)
    expect(said(announce, /You're now following Bob\./)).toBe(true)
    expect(result.current.isPending('B')).toBe(false)
  })

  it('failure: resolved { error } → NOT Following, retry possible, no backend text announced', async () => {
    insertResult = { error: { code: '42501', message: 'permission denied for table user_follows' } }
    const { result, applyFollowState, announce } = setup()
    await act(async () => { await result.current.follow('B', 'Bob') })
    expect(applyFollowState).not.toHaveBeenCalled()
    expect(said(announce, /Could not follow Bob\. Try again\./)).toBe(true)
    expect(said(announce, /permission denied|42501/)).toBe(false)
    expect(result.current.isErrored('B')).toBe(true)
  })

  it('duplicate-key 23505 is idempotent SUCCESS (already following), never a false failure', async () => {
    insertResult = { error: { code: '23505', message: 'duplicate key' } }
    const { result, applyFollowState, announce } = setup()
    await act(async () => { await result.current.follow('B', 'Bob') })
    expect(applyFollowState).toHaveBeenCalledWith('B', true)
    expect(said(announce, /You're now following Bob\./)).toBe(true)
    expect(result.current.isErrored('B')).toBe(false)
  })

  it('already-following → no-op (no insert)', async () => {
    const { result } = setup({ followingIds: new Set(['B']) })
    await act(async () => { await result.current.follow('B', 'Bob') })
    expect(insertPayloads).toEqual([])
  })
})

describe('unfollow settlement', () => {
  it('success: exact DELETE filters, state flips only after success, one announcement', async () => {
    const { result, applyFollowState, announce } = setup({ followingIds: new Set(['B']) })
    await act(async () => { await result.current.unfollow('B', 'Bob') })
    expect(deleteFilters).toEqual([{ follower_id: ME, following_id: 'B' }])
    expect(applyFollowState).toHaveBeenCalledWith('B', false)
    expect(said(announce, /You stopped following Bob\./)).toBe(true)
  })

  it('failure: keeps Following, one failure announcement, no backend text', async () => {
    deleteResult = { error: { code: 'XX', message: 'boom' } }
    const { result, applyFollowState, announce } = setup({ followingIds: new Set(['B']) })
    await act(async () => { await result.current.unfollow('B', 'Bob') })
    expect(applyFollowState).not.toHaveBeenCalled()
    expect(said(announce, /Could not unfollow Bob\. Try again\./)).toBe(true)
    expect(said(announce, /boom/)).toBe(false)
  })
})

describe('concurrency + self-follow', () => {
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
    const { result, applyFollowState, announce } = setup()
    await act(async () => { await result.current.follow(ME, 'Me') })
    expect(insertPayloads).toEqual([])
    expect(applyFollowState).not.toHaveBeenCalled()
    expect(announce).not.toHaveBeenCalled()
  })

  it('late completion after unmount does not throw / update state', async () => {
    insertDelayMs = 40
    const { result, unmount } = setup()
    let p
    act(() => { p = result.current.follow('B', 'Bob') })
    unmount()
    await act(async () => { await p })
  })
})

describe('usePeopleHideActions — session-local Hide + truthful Undo', () => {
  it('hide: marks the id hidden, announces "for this session", no Supabase write', () => {
    const announce = vi.fn()
    const { result } = renderHook(() => usePeopleHideActions({ announce }))
    act(() => { result.current.hide('B', 'Bob') })
    expect(result.current.isHidden('B')).toBe(true)
    expect(result.current.isHidden('C')).toBe(false)
    expect(announce).toHaveBeenCalledWith('Hidden Bob for this session.')
    expect(insertPayloads).toEqual([]); expect(deleteFilters).toEqual([])
    expect(result.current.lastHidden).toEqual({ id: 'B', name: 'Bob' })
  })

  it('undo: un-hides the latest, announces Restored, clears the Undo target', () => {
    const announce = vi.fn()
    const { result } = renderHook(() => usePeopleHideActions({ announce }))
    act(() => { result.current.hide('B', 'Bob') })
    act(() => { result.current.undo() })
    expect(result.current.isHidden('B')).toBe(false)
    expect(announce).toHaveBeenCalledWith('Restored Bob.')
    expect(result.current.lastHidden).toBeNull()
  })

  it('one-latest-Hide: a second hide keeps the first hidden but moves the Undo target', () => {
    const announce = vi.fn()
    const { result } = renderHook(() => usePeopleHideActions({ announce }))
    act(() => { result.current.hide('B', 'Bob') })
    act(() => { result.current.hide('C', 'Cy') })
    act(() => { result.current.undo() }) // undoes C only
    expect(result.current.isHidden('B')).toBe(true)
    expect(result.current.isHidden('C')).toBe(false)
  })

  it('nextFocusId prefers next, then previous, then null', () => {
    expect(nextFocusId(['a', 'b', 'c'], 'a')).toBe('b')
    expect(nextFocusId(['a', 'b', 'c'], 'c')).toBe('b')
    expect(nextFocusId(['a'], 'a')).toBeNull()
    expect(nextFocusId(['a', 'b'], 'z')).toBeNull()
    expect(nextFocusId(null, 'a')).toBeNull()
  })
})
