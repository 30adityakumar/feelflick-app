import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

let currentUserId = 'SELF'
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ userId: currentUserId }) }))

function freshDb() {
  return {
    user_settings: { data: { settings: { prefs: { runtimeFloor: 95, avoidGenres: ['Horror'], notifications: { x: 1 } } }, updated_at: 'T1' }, error: null },
    user_preferences: { data: [{ genre_id: 18, excluded: false }], error: null },
    user_history: { data: [{ movies: { director_name: 'Bong Joon-ho' } }, { movies: { director_name: 'Bong Joon-ho' } }], error: null },
  }
}
let db = freshDb()
let rpcResult = { data: { updated_at: 'T2' }, error: null }
const rpc = vi.fn(async () => rpcResult)

vi.mock('@/shared/lib/supabase/client', () => {
  const builder = (table) => {
    const result = () => Promise.resolve(db[table])
    const b = { select: () => b, eq: () => b, maybeSingle: () => result(), limit: () => result(), then: (res, rej) => result().then(res, rej) }
    return b
  }
  return { supabase: { from: (t) => builder(t), rpc: (...a) => rpc(...a) } }
})

import { PreferencesDataProvider, usePreferencesData } from '../usePreferencesData'

const wrapper = ({ children }) => <PreferencesDataProvider>{children}</PreferencesDataProvider>
const mount = () => renderHook(() => usePreferencesData(), { wrapper })

beforeEach(() => { db = freshDb(); rpcResult = { data: { updated_at: 'T2' }, error: null }; rpc.mockReset(); rpc.mockImplementation(async () => rpcResult); currentUserId = 'SELF' })

describe('load — hardened critical/optional handling', () => {
  it('success: ready, draft from real data, updatedAt token + suggestions', async () => {
    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.draft.drawnGenreIds).toEqual([18])
    expect(result.current.draft.avoidGenreIds).toContain(27) // Horror
    expect(result.current.draft.runtimeFloor).toBe(95)
    expect(result.current.updatedAt).toBe('T1')
    expect(result.current.directorSuggestions).toContain('Bong Joon-ho')
  })

  it('critical failure: load_error, NO editable baseline from defaults', async () => {
    db.user_settings = { data: null, error: { message: 'boom' } }
    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('load_error'))
    // draft remains the inert default; not a baseline derived from a failed read
    expect(result.current.dirty).toBe(false)
  })

  it('optional suggestion failure: degraded, page renders, no suggestions', async () => {
    db.user_history = { data: null, error: { message: 'history down' } }
    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('degraded'))
    expect(result.current.suggestionsUnavailable).toBe(true)
    expect(result.current.directorSuggestions).toEqual([])
  })
})

describe('save — transactional RPC only', () => {
  it('success: commits baseline, advances updatedAt, sends expected token, rpc-only', async () => {
    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))
    act(() => result.current.setRuntimeFloor(120))
    expect(result.current.dirty).toBe(true)
    await act(async () => { await result.current.save() })
    expect(rpc).toHaveBeenCalledWith('save_user_preferences_v2', expect.objectContaining({ p_expected_updated_at: 'T1' }))
    expect(result.current.saveStatus).toBe('saved')
    expect(result.current.updatedAt).toBe('T2')
    expect(result.current.dirty).toBe(false)
  })

  it('conflict (PT409): conflict state, baseline NOT committed', async () => {
    rpcResult = { data: null, error: { code: 'PT409', message: 'changed elsewhere' } }
    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))
    act(() => result.current.setRuntimeFloor(120))
    await act(async () => { await result.current.save() })
    expect(result.current.conflict).toBe(true)
    expect(result.current.dirty).toBe(true) // not committed
    expect(result.current.liveMessage).toMatch(/changed in another tab/i) // announced to SR
  })

  it('error (other): save_error + safe copy, draft retained, retryable', async () => {
    rpcResult = { data: null, error: { code: 'XX500', message: 'db text' } }
    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))
    act(() => result.current.setRuntimeFloor(120))
    await act(async () => { await result.current.save() })
    expect(result.current.saveStatus).toBe('save_error')
    expect(result.current.saveError).toBe('Could not save your preferences. Try again.')
    expect(result.current.saveError).not.toMatch(/db text/) // never raw backend text
    expect(result.current.liveMessage).toMatch(/Could not save/i) // failure announced to SR
    expect(result.current.dirty).toBe(true)
  })

  it('duplicate submit is guarded (rpc called once)', async () => {
    let release
    rpc.mockImplementation(() => new Promise((r) => { release = () => r(rpcResult) }))
    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))
    act(() => result.current.setRuntimeFloor(120))
    await act(async () => { result.current.save(); result.current.save() })
    expect(rpc).toHaveBeenCalledTimes(1)
    await act(async () => { release() })
  })

  it('logout mid-save: stale completion ignored (baseline not committed)', async () => {
    let release
    rpc.mockImplementation(() => new Promise((r) => { release = () => r({ data: { updated_at: 'T9' }, error: null }) }))
    const { result, rerender } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))
    act(() => result.current.setRuntimeFloor(120))
    act(() => { result.current.save() })
    currentUserId = 'OTHER'   // user switched while the save is in flight
    rerender()
    await act(async () => { release() })
    expect(result.current.saveStatus).not.toBe('saved') // stale result not applied
  })

  it('save is a no-op when not dirty', async () => {
    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(async () => { await result.current.save() })
    expect(rpc).not.toHaveBeenCalled()
  })
})

describe('discard restores the persisted baseline', () => {
  it('discard reverts edits and clears save state', async () => {
    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))
    act(() => result.current.setRuntimeFloor(140))
    expect(result.current.dirty).toBe(true)
    act(() => result.current.discard())
    expect(result.current.dirty).toBe(false)
    expect(result.current.draft.runtimeFloor).toBe(95) // back to persisted value, not default 90
  })
})
