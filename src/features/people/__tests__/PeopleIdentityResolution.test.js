import { describe, it, expect } from 'vitest'
import { deriveTwins, deriveRising, deriveSuggested } from '../usePeopleData'

// Regression for the closest-matches RLS-dead defect: public.users is owner-only (F8.2), so the
// user_similarity embedded users() FK join returns null for every counterpart and the twin/rising/
// similarity-suggested rails rendered EMPTY in production. The fix resolves identity from the
// get_people_public_identities RPC (`usersById`) instead. These pure tests prove that contract.

// 8 similarity rows ranked by overall_similarity (the slices: twins 0-4, rising 4-7, suggested 7-13).
const ROWS = [
  { user_b_id: 'u1', overall_similarity: 0.92, movies_in_common: 18 },
  { user_b_id: 'u2', overall_similarity: 0.81, movies_in_common: 9 },
  { user_b_id: 'u3', overall_similarity: 0.70, movies_in_common: 4 },
  { user_b_id: 'u4', overall_similarity: 0.61, movies_in_common: 2 },
  { user_b_id: 'u5', overall_similarity: 0.55, movies_in_common: 6 },
  { user_b_id: 'u6', overall_similarity: 0.50, movies_in_common: 3 },
  { user_b_id: 'u7', overall_similarity: 0.44, movies_in_common: 1 },
  { user_b_id: 'u8', overall_similarity: 0.40, movies_in_common: 12 },
]
// Identities from the RPC. u4 is intentionally ABSENT (e.g. opted out of discovery) → must be dropped.
const usersById = new Map([
  ['u1', { id: 'u1', name: 'Ana', avatar_url: 'a.png' }],
  ['u2', { id: 'u2', name: 'Bo', avatar_url: null }],
  ['u3', { id: 'u3', name: 'Cy', avatar_url: null }],
  ['u5', { id: 'u5', name: 'Eve', avatar_url: null }],
  ['u6', { id: 'u6', name: 'Fin', avatar_url: null }],
  ['u7', { id: 'u7', name: 'Gus', avatar_url: null }],
  ['u8', { id: 'u8', name: 'Hal', avatar_url: null }],
])
const fp = new Map([['u1', { total: 40 }], ['u2', { total: 20 }]])
const NO_FOLLOWS = new Set()

describe('F8.8-prep — similarity rails resolve identity from the RPC, not the RLS-null embedded join', () => {
  it('twins render from usersById (NOT row.users) — the rail is no longer empty', () => {
    const twins = deriveTwins(ROWS, NO_FOLLOWS, usersById, fp)
    expect(twins.length).toBeGreaterThan(0)                 // the defect was: always [] in prod
    // ranks 0-3, but u4 has no RPC identity → dropped → twins = u1,u2,u3
    expect(twins.map(t => t.id)).toEqual(['u1', 'u2', 'u3'])
    expect(twins.map(t => t.name)).toEqual(['Ana', 'Bo', 'Cy']) // names come from the RPC
  })

  it('a candidate with no RPC identity (opted out) is dropped, not rendered Anonymous', () => {
    const twins = deriveTwins(ROWS, NO_FOLLOWS, usersById, fp)
    expect(twins.find(t => t.id === 'u4')).toBeUndefined()
  })

  it('rising uses the 4-7 slice and resolves identity from the RPC', () => {
    const rising = deriveRising(ROWS, NO_FOLLOWS, usersById, fp)
    expect(rising.map(r => r.id)).toEqual(['u5', 'u6', 'u7']) // ranks 4-6 (u4 already past)
    expect(rising.map(r => r.name)).toEqual(['Eve', 'Fin', 'Gus'])
  })

  it('ranking/slice order is preserved (sorted-similarity order unchanged by the identity fix)', () => {
    const twins = deriveTwins(ROWS, NO_FOLLOWS, usersById, fp)
    const sims = twins.map(t => ROWS.find(r => r.user_b_id === t.id).overall_similarity)
    expect(sims).toEqual([...sims].sort((a, b) => b - a)) // strictly descending
  })

  it('suggested (7-13) resolves from the RPC, excludes already-followed + self', () => {
    const suggested = deriveSuggested(ROWS, new Set(['u8']), 'me', usersById, fp)
    // u8 is the only rank ≥7 here and it is followed → excluded → empty
    expect(suggested.map(s => s.id)).not.toContain('u8')
  })

  it('no card carries name/avatar from a row.users field (identity is RPC-only)', () => {
    // even if a stray embedded users slipped onto a row, it must be ignored
    const rowsWithStrayEmbed = [{ ...ROWS[0], users: { id: 'u1', name: 'WRONG', avatar_url: 'x' } }]
    const twins = deriveTwins(rowsWithStrayEmbed, NO_FOLLOWS, usersById, fp)
    expect(twins[0].name).toBe('Ana') // from usersById, never the embedded 'WRONG'
  })
})
