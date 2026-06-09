import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'

const cfg = { history: [], ratings: [], deleteError: null }
const deleteCalls = []
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    from: (table) => {
      const op = { table, kind: 'select', eqs: [] }
      const chain = {
        select: vi.fn(() => chain),
        delete: vi.fn(() => { op.kind = 'delete'; return chain }),
        eq: vi.fn((c, v) => { op.eqs.push([c, v]); return chain }),
        order: vi.fn(() => chain),
        then: (res, rej) => {
          if (op.kind === 'delete') { deleteCalls.push(op); return Promise.resolve({ error: cfg.deleteError }).then(res, rej) }
          const data = table === 'user_history' ? cfg.history : table === 'user_ratings' ? cfg.ratings : []
          return Promise.resolve({ data, error: null }).then(res, rej)
        },
      }
      return chain
    },
  },
}))
vi.mock('@/shared/hooks/useAuthSession', () => { const u = { id: 'u1' }; return { useAuthSession: () => ({ user: u }) } })

import { HistoryDataProvider, useHistoryData } from '../useHistoryData'

const hist = () => [
  { movie_id: 1, watched_at: '2026-03-09T20:00:00', movies: { id: 11, tmdb_id: 101, title: 'A', director_name: 'D', release_date: '2020-06-15', runtime: 100, mood_tags: ['tender'], poster_path: '/p.jpg' } },
  { movie_id: 2, watched_at: '2026-03-08T20:00:00', movies: { id: 12, tmdb_id: 102, title: 'B', director_name: 'E', release_date: '2019-06-15', runtime: 90, mood_tags: ['cozy'], poster_path: '/q.jpg' } },
]

let ctx
function Probe() { ctx = useHistoryData(); return null }
async function mountProvider() {
  render(<HistoryDataProvider><Probe /></HistoryDataProvider>)
  await waitFor(() => expect(ctx.loading).toBe(false))
}
const entryIdOf = (movieId) => ctx.entries.find(e => e.movieId === movieId)?.id

beforeEach(() => { cfg.history = hist(); cfg.ratings = [{ movie_id: 1, rating: 8, review_text: 'note' }]; cfg.deleteError = null; deleteCalls.length = 0 })
afterEach(() => vi.clearAllMocks())

describe('Diary removal — settled (F6.3)', () => {
  it('18/23/24. success returns { ok, action, entryId, movieId }; delete keys off user_id+movie_id on user_history ONLY', async () => {
    await mountProvider()
    const id = entryIdOf(1)
    let res
    await act(async () => { res = await ctx.removeEntry(id) })
    expect(res).toMatchObject({ ok: true, action: 'removed', movieId: 1 })
    expect(res.entryId).toBe(id)
    const del = deleteCalls.find(d => d.kind === 'delete')
    expect(del.table).toBe('user_history')
    expect(del.eqs).toEqual([['user_id', 'u1'], ['movie_id', 1]])
    // ratings/feedback tables never deleted
    expect(deleteCalls.some(d => d.table === 'user_ratings' || d.table === 'user_movie_feedback')).toBe(false)
  })

  it('19/20. a RESOLVED { error } returns failure and retains the entry', async () => {
    cfg.deleteError = { code: 'PGRST', message: 'rls policy detail' }
    await mountProvider()
    const id = entryIdOf(1)
    let res
    await act(async () => { res = await ctx.removeEntry(id) })
    expect(res.ok).toBe(false)
    expect(res.action).toBe('remove_failed')
    expect(ctx.entries.some(e => e.movieId === 1)).toBe(true) // retained — no false success
  })

  it('21/22. duplicate click fires ONE delete; pending clears', async () => {
    await mountProvider()
    const id = entryIdOf(1)
    let r1, r2
    await act(async () => { const p1 = ctx.removeEntry(id); const p2 = ctx.removeEntry(id); [r1, r2] = await Promise.all([p1, p2]) })
    expect(deleteCalls.filter(d => d.kind === 'delete')).toHaveLength(1)
    expect([r1, r2].some(r => r.duplicate)).toBe(true)
    expect(ctx.removingEntryIds.has(id)).toBe(false)
    expect(ctx.isRemoving(id)).toBe(false)
  })

  it('25. context exposes no load error after a removal failure', async () => {
    cfg.deleteError = { message: 'secret backend detail' }
    await mountProvider()
    await act(async () => { await ctx.removeEntry(entryIdOf(1)) })
    expect(ctx.error).toBeNull()
  })
})
