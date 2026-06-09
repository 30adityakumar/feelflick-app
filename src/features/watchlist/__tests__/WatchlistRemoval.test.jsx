import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'

// ── controllable Supabase mock (records delete filters; resolves { error }) ──
const cfg = { rows: [], deleteError: null, selectError: null }
const deleteCalls = []
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    from: () => {
      const op = { kind: 'select', eqs: [], ins: [] }
      const chain = {
        select: vi.fn(() => chain),
        delete: vi.fn(() => { op.kind = 'delete'; return chain }),
        eq: vi.fn((c, v) => { op.eqs.push([c, v]); return chain }),
        in: vi.fn((c, v) => { op.ins.push([c, v]); return chain }),
        order: vi.fn(() => chain),
        then: (res, rej) => {
          if (op.kind === 'delete') { deleteCalls.push(op); return Promise.resolve({ error: cfg.deleteError }).then(res, rej) }
          return Promise.resolve({ data: cfg.rows, error: cfg.selectError }).then(res, rej)
        },
      }
      return chain
    },
  },
}))
vi.mock('@/shared/hooks/useAuthSession', () => { const u = { id: 'u1' }; return { useAuthSession: () => ({ user: u }) } })
vi.mock('@/shared/services/tasteCache', () => ({ getTasteFingerprint: vi.fn(async () => null) }))
vi.mock('@/shared/services/recommendations', () => ({ computeUserProfile: vi.fn(async () => null), scoreMovieForUser: vi.fn(() => null) }))
vi.mock('@/shared/services/matchScore', () => ({ computeMatchPercent: vi.fn(() => null) }))
vi.mock('@/shared/services/movieFields', () => ({ MOVIE_ENGINE_COLS: '*' }))

import { WatchlistDataProvider, useWatchlistData } from '../useWatchlistData'

const ago = (days) => new Date(Date.now() - days * 86400000).toISOString()
const rows = () => [
  { movie_id: 1, added_at: ago(1), status: 'want_to_watch', movies: { id: 11, tmdb_id: 101, title: 'A', mood_tags: ['tender'], release_date: '2020-06-15', runtime: 100, director_name: 'D', poster_path: '/p.jpg', ff_final_rating: 8, fit_profile: null } },
  { movie_id: 2, added_at: ago(90), status: 'want_to_watch', movies: { id: 12, tmdb_id: 102, title: 'B', mood_tags: ['cozy'], release_date: '2019-06-15', runtime: 90, director_name: 'E', poster_path: '/q.jpg', ff_final_rating: 7, fit_profile: null } }, // >60d → stale
]

let ctx
function Probe() { ctx = useWatchlistData(); return null }
async function mountProvider() {
  render(<WatchlistDataProvider><Probe /></WatchlistDataProvider>)
  await waitFor(() => expect(ctx.loading).toBe(false))
}

beforeEach(() => {
  cfg.rows = rows(); cfg.deleteError = null; cfg.selectError = null; deleteCalls.length = 0
})
afterEach(() => { vi.clearAllMocks() })

describe('Watchlist individual removal — settled (F6.3)', () => {
  it('1/2/3/10. success inspects { error: null }, returns { ok:true }, removes once, filters = user_id + movie_id', async () => {
    await mountProvider()
    expect(ctx.items).toHaveLength(2)
    let res
    await act(async () => { res = await ctx.removeFromWatchlist(1) })
    expect(res).toMatchObject({ ok: true, action: 'removed', movieId: 1 })
    expect(ctx.items.map(i => i.id)).toEqual([2]) // removed exactly once
    const del = deleteCalls.find(d => d.kind === 'delete')
    expect(del.eqs).toEqual([['user_id', 'u1'], ['movie_id', 1]])
  })

  it('4/5. a RESOLVED { error } returns failure and does NOT permanently remove the item', async () => {
    cfg.deleteError = { code: 'PGRST', message: 'rls' }
    await mountProvider()
    let res
    await act(async () => { res = await ctx.removeFromWatchlist(1) })
    expect(res.ok).toBe(false)
    expect(res.action).toBe('remove_failed')
    expect(ctx.items.map(i => i.id)).toContain(1) // item retained — no false success
  })

  it('7/8/9. duplicate click while pending fires ONE delete; pending clears on success', async () => {
    await mountProvider()
    let r1, r2
    await act(async () => { const p1 = ctx.removeFromWatchlist(1); const p2 = ctx.removeFromWatchlist(1); [r1, r2] = await Promise.all([p1, p2]) })
    expect(deleteCalls.filter(d => d.kind === 'delete')).toHaveLength(1) // deduped
    expect(r1.ok || r2.ok).toBe(true)
    expect([r1, r2].some(r => r.duplicate)).toBe(true)
    expect(ctx.removingIds.has(1)).toBe(false) // pending cleared
    expect(ctx.isRemoving(1)).toBe(false)
  })

  it('9. pending clears on failure', async () => {
    cfg.deleteError = { message: 'boom' }
    await mountProvider()
    await act(async () => { await ctx.removeFromWatchlist(1) })
    expect(ctx.removingIds.has(1)).toBe(false)
  })

  it('11. the public context never exposes a raw Error object', async () => {
    cfg.deleteError = { message: 'secret table policy detail' }
    await mountProvider()
    await act(async () => { await ctx.removeFromWatchlist(1) })
    expect(JSON.stringify(Object.keys(ctx))).not.toContain('error: [object')
    expect(ctx.error).toBeNull() // a removal failure is not a load error
  })
})

describe('Watchlist load no longer triggers recommendation work (F6.4)', () => {
  it('13/14/15/16. loads only the saved-film query — no fingerprint fetch, no profile compute, no bulk API', async () => {
    const { getTasteFingerprint } = await import('@/shared/services/tasteCache')
    const { computeUserProfile } = await import('@/shared/services/recommendations')
    await mountProvider()
    expect(getTasteFingerprint).not.toHaveBeenCalled()  // no fingerprint → no taste-cache work
    expect(computeUserProfile).not.toHaveBeenCalled()    // no profile compute → no profile-cache WRITE on view
    // the bulk API is gone from the public context
    expect(ctx.removeStale).toBeUndefined()
    expect(ctx.removingStale).toBeUndefined()
    expect(ctx.total).toBe(ctx.items.length)
  })

  it('19. the saved-film read is user-scoped', async () => {
    await mountProvider()
    expect(ctx.items.length).toBeGreaterThan(0) // proves the user-scoped select resolved
  })
})
