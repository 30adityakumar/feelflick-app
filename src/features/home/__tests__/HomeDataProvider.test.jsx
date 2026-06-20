import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// A thenable Supabase query builder that records the table it was opened on.
// supabase-js resolves with { data, error } (it does NOT throw on HTTP errors),
// so `failTable` lets a test simulate a failed read on a specific table.
const fromCalls = []
let failTable = null
function builder(table, data = []) {
  const err = failTable && table === failTable ? { message: 'boom' } : null
  const b = {
    select: () => b, eq: () => b, order: () => b, limit: () => b, maybeSingle: () => b,
    then: (resolve) => resolve({ data: err ? null : data, error: err }),
  }
  return b
}
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn((t) => { fromCalls.push(t); return builder(t) }) },
}))
// Stable identities — the real hook returns memoized values; returning fresh
// objects here would re-trigger the provider effect every render (infinite loop).
const AUTH = { user: { id: 'u1' }, session: { user: { email: 'a@b.com' } } }
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => AUTH }))
const getTasteFingerprint = vi.fn(() => Promise.resolve(null))
vi.mock('@/shared/services/tasteCache', () => ({ getTasteFingerprint: (...a) => getTasteFingerprint(...a) }))
const computeUserProfileV3 = vi.fn(() => Promise.resolve({}))
vi.mock('@/shared/services/recommendations', () => ({ computeUserProfileV3: (...a) => computeUserProfileV3(...a) }))

import { HomeDataProvider, useHomeData, prefetchHomeData } from '../useHomeData'

function Probe() {
  const d = useHomeData()
  return <pre data-testid="out">{JSON.stringify({ keys: Object.keys(d).sort(), loading: d.loading, name: d.user?.name, hasDna: !!d.dna, error: d.error })}</pre>
}

beforeEach(() => { vi.clearAllMocks(); fromCalls.length = 0; failTable = null })

describe('HomeDataProvider — reduced (DNA + user) contract', () => {
  it('exposes ONLY { dna, error, loading, user } — the legacy rec fields are gone', async () => {
    render(<HomeDataProvider><Probe /></HomeDataProvider>)
    await waitFor(() => expect(JSON.parse(screen.getByTestId('out').textContent).loading).toBe(false))
    const out = JSON.parse(screen.getByTestId('out').textContent)
    expect(out.keys).toEqual(['dna', 'error', 'loading', 'user'])
    expect(out.hasDna).toBe(true)
    expect(out.name).toBe('a') // email local-part fallback
  })

  it('does NOT run the legacy recommendation pipeline (no candidate pool / similarity / prefs queries)', async () => {
    render(<HomeDataProvider><Probe /></HomeDataProvider>)
    await waitFor(() => expect(JSON.parse(screen.getByTestId('out').textContent).loading).toBe(false))
    expect(fromCalls).toContain('user_history')
    expect(fromCalls).toContain('user_ratings')
    // The retired pipeline's tables must NOT be queried by the provider anymore.
    expect(fromCalls).not.toContain('movies')
    expect(fromCalls).not.toContain('user_similarity')
    expect(fromCalls).not.toContain('user_preferences')
  })

  it('surfaces an honest error (not a silent cold DNA) when the history read fails', async () => {
    failTable = 'user_history'
    render(<HomeDataProvider><Probe /></HomeDataProvider>)
    await waitFor(() => expect(JSON.parse(screen.getByTestId('out').textContent).loading).toBe(false))
    const out = JSON.parse(screen.getByTestId('out').textContent)
    expect(out.error).toBeTruthy()
    expect(out.hasDna).toBe(false)
  })

  it('prefetchHomeData warms the NEW pipeline (v3 profile), not the old candidate pool', async () => {
    await prefetchHomeData('u1')
    expect(computeUserProfileV3).toHaveBeenCalledWith('u1')
    expect(fromCalls).not.toContain('movies')
  })
})
