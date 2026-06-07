// src/shared/services/__tests__/onboarding.test.js
// F2.24 — completeOnboarding idempotency. Onboarding-sourced history + ratings now
// use a constraint-agnostic REPLACE-BY-SOURCE strategy (delete source='onboarding'
// → insert) so a re-run can't duplicate history or hit the (user_id,movie_id)
// uniqueness conflict, and non-onboarding rows are never touched. Supabase is
// mocked with a per-table call recorder (no live DB).

import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ calls: [], errors: {}, usersExists: true, supabase: null }))

vi.mock('@/shared/lib/supabase/client', () => {
  const result = (table, op) => h.errors[`${table}:${op}`] ?? { data: null, error: null }
  const supabase = {
    from(table) {
      const state = { table, op: null, filters: {}, rows: undefined, vals: undefined }
      const b = {
        select(...a) { if (!state.op) state.op = 'select'; state.selectArgs = a; return b },
        insert(rows) { state.op = 'insert'; state.rows = rows; h.calls.push({ table, op: 'insert', rows }); return b },
        upsert(rows, opts) { state.op = 'upsert'; state.rows = rows; h.calls.push({ table, op: 'upsert', rows, opts }); return b },
        update(vals) { state.op = 'update'; state.vals = vals; return b },
        delete() { state.op = 'delete'; return b },
        eq(col, val) { state.filters[col] = val; return b },
        single() { return Promise.resolve(result(table, state.op)) },
        maybeSingle() {
          if (table === 'movies' && state.filters.tmdb_id != null) return Promise.resolve({ data: { id: `internal-${state.filters.tmdb_id}` }, error: null })
          if (table === 'users') return Promise.resolve({ data: h.usersExists ? { id: state.filters.id } : null, error: null })
          if (table === 'user_profiles_computed') return Promise.resolve({ data: { user_id: state.filters.user_id }, error: null })
          return Promise.resolve(result(table, 'select'))
        },
        then(res, rej) {
          if (state.op === 'delete') h.calls.push({ table, op: 'delete', filters: { ...state.filters } })
          if (state.op === 'update') h.calls.push({ table, op: 'update', vals: state.vals, filters: { ...state.filters } })
          return Promise.resolve(result(table, state.op)).then(res, rej)
        },
      }
      return b
    },
    auth: { updateUser: vi.fn().mockResolvedValue({ error: null }) },
  }
  h.supabase = supabase
  return { supabase }
})
vi.mock('@/shared/api/tmdb', () => ({ fetchJson: vi.fn().mockResolvedValue({ id: 0, title: 'X' }) }))
vi.mock('@/shared/services/recommendations', () => ({ computeUserProfileV3: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/shared/services/tasteCache', () => ({ getTasteFingerprint: vi.fn().mockResolvedValue({}) }))
vi.mock('@/shared/services/analytics', () => ({ track: vi.fn() }))

import { completeOnboarding } from '../onboarding'
import { computeUserProfileV3 } from '@/shared/services/recommendations'
import { getTasteFingerprint } from '@/shared/services/tasteCache'
import { track } from '@/shared/services/analytics'

const session = { user: { id: 'u1', email: 'u1@test.dev', user_metadata: {} } }
const baseArgs = () => ({
  session,
  selectedGenres: [18, 28],
  favoriteMovies: [{ id: 1, title: 'A' }, { id: 2, title: 'B' }, { id: 3, title: 'C' }],
  ratings: { 1: 9, 2: 7, 3: 5 }, // loved / liked / okay
  moods: ['cozy'],
})
const byTable = (table, op) => h.calls.filter(c => c.table === table && c.op === op)
const opsFor = (table) => h.calls.filter(c => c.table === table).map(c => c.op)

beforeEach(() => {
  h.calls = []; h.errors = {}; h.usersExists = true
  vi.clearAllMocks()
  h.supabase.auth.updateUser.mockResolvedValue({ error: null })
})

describe('completeOnboarding — first completion writes', () => {
  it('saves genres, history, ratings, updates user, computes profile, pre-warms fingerprint, tracks', async () => {
    await completeOnboarding({ ...baseArgs(), markAuthComplete: false })
    expect(byTable('user_preferences', 'delete')).toHaveLength(1)
    expect(byTable('user_preferences', 'upsert')).toHaveLength(1)
    expect(byTable('user_history', 'insert')).toHaveLength(1)
    expect(byTable('user_history', 'insert')[0].rows).toHaveLength(3)
    expect(byTable('user_ratings', 'insert')).toHaveLength(1)
    expect(byTable('users', 'update')[0].vals).toMatchObject({ onboarding_complete: true })
    expect(computeUserProfileV3).toHaveBeenCalledWith('u1', { forceRefresh: true })
    expect(getTasteFingerprint).toHaveBeenCalledWith('u1')
    expect(track).toHaveBeenCalledWith('onboarding_completed', expect.objectContaining({ movie_count: 3 }))
  })

  it('inserts the users row when it does not yet exist', async () => {
    h.usersExists = false
    await completeOnboarding({ ...baseArgs(), markAuthComplete: false })
    expect(byTable('users', 'insert')).toHaveLength(1)
    expect(byTable('users', 'insert')[0].rows).toMatchObject({ id: 'u1' })
  })

  it('rating numeric mappings flow through unchanged (okay=5, liked=7, loved=9) with source=onboarding', async () => {
    await completeOnboarding({ ...baseArgs(), markAuthComplete: false })
    const rows = byTable('user_ratings', 'insert')[0].rows
    const byMovie = Object.fromEntries(rows.map(r => [r.movie_id, r.rating]))
    expect(byMovie['internal-1']).toBe(9) // loved
    expect(byMovie['internal-2']).toBe(7) // liked
    expect(byMovie['internal-3']).toBe(5) // okay
    rows.forEach(r => expect(r.source).toBe('onboarding'))
  })

  it('history rows preserve source/onboarding + null watch_duration + null mood_session', async () => {
    await completeOnboarding({ ...baseArgs(), markAuthComplete: false })
    byTable('user_history', 'insert')[0].rows.forEach(r => {
      expect(r.source).toBe('onboarding')
      expect(r.watch_duration_minutes).toBeNull()
      expect(r.mood_session_id).toBeNull()
    })
  })
})

describe('completeOnboarding — idempotency (replace-by-source)', () => {
  it('replaces onboarding HISTORY (delete source=onboarding → insert)', async () => {
    await completeOnboarding({ ...baseArgs(), markAuthComplete: false })
    const del = byTable('user_history', 'delete')
    expect(del).toHaveLength(1)
    expect(del[0].filters).toMatchObject({ user_id: 'u1', source: 'onboarding' })
    expect(opsFor('user_history')).toEqual(['delete', 'insert'])
  })

  it('replaces onboarding RATINGS (delete source=onboarding → batch insert, no per-row conflict)', async () => {
    await completeOnboarding({ ...baseArgs(), markAuthComplete: false })
    const del = byTable('user_ratings', 'delete')
    expect(del).toHaveLength(1)
    expect(del[0].filters).toMatchObject({ user_id: 'u1', source: 'onboarding' })
    expect(opsFor('user_ratings')).toEqual(['delete', 'insert'])
  })

  it('a re-run keeps the same delete+insert shape (no duplicate accumulation)', async () => {
    await completeOnboarding({ ...baseArgs(), markAuthComplete: false })
    h.calls = []
    await completeOnboarding({ ...baseArgs(), markAuthComplete: false })
    expect(byTable('user_history', 'delete')).toHaveLength(1)
    expect(byTable('user_history', 'insert')).toHaveLength(1)
    expect(byTable('user_ratings', 'delete')).toHaveLength(1)
    expect(byTable('user_ratings', 'insert')).toHaveLength(1)
  })

  it('only source=onboarding rows are deleted — non-onboarding rows are never targeted', async () => {
    await completeOnboarding({ ...baseArgs(), markAuthComplete: false })
    ;['user_history', 'user_ratings'].forEach(t =>
      byTable(t, 'delete').forEach(d => expect(d.filters.source).toBe('onboarding')))
  })
})

describe('completeOnboarding — auth flip (unchanged)', () => {
  it('markAuthComplete:false skips auth.updateUser', async () => {
    await completeOnboarding({ ...baseArgs(), markAuthComplete: false })
    expect(h.supabase.auth.updateUser).not.toHaveBeenCalled()
  })
  it('markAuthComplete:true flips the auth metadata exactly once', async () => {
    await completeOnboarding({ ...baseArgs(), markAuthComplete: true })
    expect(h.supabase.auth.updateUser).toHaveBeenCalledTimes(1)
    expect(h.supabase.auth.updateUser).toHaveBeenCalledWith({ data: { onboarding_complete: true, has_onboarded: true } })
  })
})

describe('completeOnboarding — error behavior (unchanged)', () => {
  it('a history insert failure surfaces a user-facing completion error', async () => {
    h.errors['user_history:insert'] = { error: { message: 'db down' } }
    await expect(completeOnboarding({ ...baseArgs(), markAuthComplete: false })).rejects.toThrow(/favorite movies/i)
  })

  it('a ratings insert failure stays non-fatal (completion resolves; profile still computes)', async () => {
    h.errors['user_ratings:insert'] = { error: { message: 'conflict' } }
    await expect(completeOnboarding({ ...baseArgs(), markAuthComplete: false })).resolves.toBeUndefined()
    expect(computeUserProfileV3).toHaveBeenCalled()
  })
})
