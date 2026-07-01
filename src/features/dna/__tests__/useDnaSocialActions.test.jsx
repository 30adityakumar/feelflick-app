import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Mock the supabase client: insert/delete resolve ok by default.
const calls = []
const chain = (table) => ({
  insert: (row) => { calls.push(['insert', table, row]); return Promise.resolve({ error: null }) },
  delete: () => {
    const d = { _eqs: {} }
    d.eq = (k, v) => { d._eqs[k] = v; return d }
    d.then = (res) => { calls.push(['delete', table, d._eqs]); return Promise.resolve({ error: null }).then(res) }
    return d
  },
})
vi.mock('@/shared/lib/supabase/client', () => ({ supabase: { from: (t) => chain(t) } }))
vi.mock('@/shared/services/betaEvents', () => ({ trackEvent: vi.fn(), EVENTS: { dna_profile_endorsed: 'e', dna_profile_review_liked: 'l', dna_profile_list_saved: 's' } }))

import { useDnaSocialActions } from '../useDnaSocialActions'

const initial = {
  endorsements: [{ trait: 'Quiet dramas', count: 2, mine: false }],
  reviewLikes: [{ movie_id: 10, count: 1, mine: false }],
  listSaves: [{ list_id: 'l1', count: 3, mine: true }],
}

beforeEach(() => { calls.length = 0 })

describe('useDnaSocialActions', () => {
  it('exposes real initial counts + mine flags', () => {
    const { result } = renderHook(() => useDnaSocialActions({ targetId: 't', viewerId: 'v', isOwner: false, initial }))
    expect(result.current.endorseFor('Quiet dramas')).toEqual({ count: 2, mine: false })
    expect(result.current.saveFor('l1')).toEqual({ count: 3, mine: true })
    expect(result.current.totals).toEqual({ endorsementsReceived: 2, reviewLikesReceived: 1, listSavesReceived: 3 })
    expect(result.current.canAct).toBe(true)
  })

  it('optimistically endorses (count+1, mine=true) and writes an insert', async () => {
    const { result } = renderHook(() => useDnaSocialActions({ targetId: 't', viewerId: 'v', isOwner: false, initial }))
    await act(async () => { await result.current.toggleEndorse('Quiet dramas') })
    expect(result.current.endorseFor('Quiet dramas')).toEqual({ count: 3, mine: true })
    await waitFor(() => expect(calls.some((c) => c[0] === 'insert' && c[1] === 'dna_endorsements')).toBe(true))
  })

  it('un-saves (count-1, mine=false) and writes a delete', async () => {
    const { result } = renderHook(() => useDnaSocialActions({ targetId: 't', viewerId: 'v', isOwner: false, initial }))
    await act(async () => { await result.current.toggleListSave('l1') })
    expect(result.current.saveFor('l1')).toEqual({ count: 2, mine: false })
    await waitFor(() => expect(calls.some((c) => c[0] === 'delete' && c[1] === 'user_list_follows')).toBe(true))
  })

  it('owner cannot self-act (no write, canAct false)', async () => {
    const { result } = renderHook(() => useDnaSocialActions({ targetId: 'v', viewerId: 'v', isOwner: true, initial }))
    expect(result.current.canAct).toBe(false)
    await act(async () => { await result.current.toggleEndorse('Quiet dramas') })
    expect(calls).toHaveLength(0)
    expect(result.current.endorseFor('Quiet dramas')).toEqual({ count: 2, mine: false })
  })
})
