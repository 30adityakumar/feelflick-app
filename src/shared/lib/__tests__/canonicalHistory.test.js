import { describe, it, expect } from 'vitest'
import { dedupeHistoryByMovie } from '../canonicalHistory'

// F7.3 — the shared canonical one-row-per-film rule (used by Diary, Profile, fingerprint,
// generated-summary). Behaviour must stay exactly aligned with F6.10.
const row = (movie_id, watched_at, over = {}) => ({ movie_id, watched_at, id: `${movie_id}-${watched_at}`, ...over })

describe('dedupeHistoryByMovie (shared canonical history)', () => {
  it('1. one row stays one row', () => {
    expect(dedupeHistoryByMovie([row(1, '2026-03-01T20:00:00Z')])).toHaveLength(1)
  })
  it('2/3. two/three rows for one film collapse to one', () => {
    expect(dedupeHistoryByMovie([row(1, '2026-03-01T20:00:00Z'), row(1, '2026-03-02T20:00:00Z')])).toHaveLength(1)
    expect(dedupeHistoryByMovie([row(1, '2026-03-01T20:00:00Z'), row(1, '2026-03-02T20:00:00Z'), row(1, '2026-03-03T20:00:00Z')])).toHaveLength(1)
  })
  it('3. most-recent valid watched_at wins', () => {
    const out = dedupeHistoryByMovie([row(1, '2026-03-01T20:00:00Z', { src: 'old' }), row(1, '2026-03-09T20:00:00Z', { src: 'new' }), row(1, '2026-03-05T20:00:00Z', { src: 'mid' })])
    expect(out[0]).toMatchObject({ watched_at: '2026-03-09T20:00:00Z', src: 'new' })
  })
  it('4. equal timestamps use deterministic stable input order (earlier wins)', () => {
    const out = dedupeHistoryByMovie([row(1, '2026-03-09T20:00:00Z', { src: 'first' }), row(1, '2026-03-09T20:00:00Z', { src: 'second' })])
    expect(out[0].src).toBe('first')
  })
  it('5/6. invalid movie_id and null/invalid watched_at rows are excluded', () => {
    expect(dedupeHistoryByMovie([{ watched_at: '2026-03-09T20:00:00Z' }, row(2, '2026-03-09T20:00:00Z')]).map(r => r.movie_id)).toEqual([2])
    expect(dedupeHistoryByMovie([row(1, null), row(1, 'not-a-date')])).toEqual([])
  })
  it('7. input is not mutated', () => {
    const h = [row(1, '2026-03-01T20:00:00Z'), row(1, '2026-03-02T20:00:00Z')]
    const snap = JSON.stringify(h)
    dedupeHistoryByMovie(h)
    expect(JSON.stringify(h)).toBe(snap)
    expect(h).toHaveLength(2)
  })
  it('8/9. selected row fields preserved; distinct films stay separate', () => {
    const h = [row(1, '2026-03-09T20:00:00Z', { movies: { title: 'A' }, src: 'x' }), row(2, '2026-03-08T20:00:00Z', { movies: { title: 'B' } })]
    const out = dedupeHistoryByMovie(h)
    expect(out.map(r => r.movie_id).sort()).toEqual([1, 2])
    expect(out.find(r => r.movie_id === 1)).toMatchObject({ movies: { title: 'A' }, src: 'x' })
  })
  it('10. no rewatch/synthetic field is introduced', () => {
    const out = dedupeHistoryByMovie([row(1, '2026-03-01T20:00:00Z'), row(1, '2026-03-02T20:00:00Z')])
    expect(out[0]).not.toHaveProperty('rewatch')
    expect(out[0]).not.toHaveProperty('watchCount')
  })
})
