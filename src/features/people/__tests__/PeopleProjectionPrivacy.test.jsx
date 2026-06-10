import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import peopleSource from '../usePeopleData.jsx?raw'

// F7.9 — People taste-match must read the cross-user fingerprint through the narrow authenticated
// RPC (get_discoverable_taste_profiles), never the now browser-inaccessible projection views. The
// RPC's behavioral contract (authenticated-only, opt-in gating, least-data, opted-out absence,
// own-row inclusion) is proven against the live database by scripts/verify-taste-projection-privacy.sql
// + the post-deploy role checks — the correct layer for a SQL function. Here we prove the JS
// data-access migration + honest degradation.

let rpcResult
const rpcSpy = vi.fn(() => Promise.resolve(rpcResult))
function chain() {
  const c = {}
  for (const m of ['select', 'in', 'eq', 'neq', 'order', 'limit', 'gte', 'lte', 'not', 'or', 'contains', 'is']) c[m] = () => c
  c.maybeSingle = () => Promise.resolve({ data: null, error: null })
  c.single = () => Promise.resolve({ data: null, error: null })
  c.then = (res, rej) => Promise.resolve({ data: [], error: null }).then(res, rej)
  c.catch = (fn) => Promise.resolve({ data: [], error: null }).catch(fn)
  return c
}
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: () => chain(), rpc: (...a) => rpcSpy(...a) },
}))
// Stable references — a fresh object each render would re-fire the load effect (deps include
// `session`) and loop forever.
const AUTH_USER = { id: 'me' }
const AUTH_SESSION = { user: { id: 'me', email: 'me@example.co' } }
vi.mock('@/shared/hooks/useAuthSession', () => ({
  useAuthSession: () => ({ user: AUTH_USER, session: AUTH_SESSION }),
}))

import { PeopleDataProvider, usePeopleData } from '../usePeopleData'

function Consumer({ onState }) { onState(usePeopleData()); return null }
const renderPeople = (onState) => render(<PeopleDataProvider><Consumer onState={onState} /></PeopleDataProvider>)

beforeEach(() => { rpcSpy.mockClear(); rpcResult = { data: [], error: null } })

describe('F7.9 — People reads the safe RPC, never the projection views', () => {
  it('source uses the RPC and never queries either projection view directly', () => {
    const src = peopleSource
    expect(src).toContain("rpc('get_discoverable_taste_profiles')")
    expect(src).not.toMatch(/\.from\(\s*['"]user_fingerprint_public['"]\s*\)/)
    expect(src).not.toMatch(/\.from\(\s*['"]user_similarity_discoverable['"]\s*\)/)
  })

  it('calls get_discoverable_taste_profiles and settles honestly (no error) with adaptable rows', async () => {
    // an opted-in row in RPC column shape — the provider normalizes top_mood_tags → topMoodTags etc.
    rpcResult = { data: [{ user_id: 'me', top_mood_tags: [{ key: 'tender' }], top_tone_tags: [], top_fit_profiles: [], total: 9 }], error: null }
    let last
    renderPeople(s => { last = s })
    await waitFor(() => expect(last.loading).toBe(false))
    expect(rpcSpy).toHaveBeenCalledWith('get_discoverable_taste_profiles')
    expect(last.error).toBeFalsy()
    expect(Array.isArray(last.twins)).toBe(true)
  })

  it('an RPC failure degrades honestly — no crash, empty rails, no raw error as data', async () => {
    rpcResult = { data: null, error: { message: 'permission denied' } }
    let last
    renderPeople(s => { last = s })
    await waitFor(() => expect(last.loading).toBe(false))
    expect(rpcSpy).toHaveBeenCalledWith('get_discoverable_taste_profiles')
    expect(Array.isArray(last.twins)).toBe(true)
    expect(Array.isArray(last.suggested)).toBe(true)
  })
})
