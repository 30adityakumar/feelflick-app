import { describe, it, expect } from 'vitest'
import { deriveTrajectoryYear } from '../derive'

const h = (watched_at) => ({ movie_id: Math.random(), watched_at, movies: {} })

describe('deriveTrajectoryYear', () => {
  it('buckets the current calendar year by month, through the current month only', () => {
    const now = new Date('2026-06-15T12:00:00Z')
    const history = [
      h('2026-01-05T10:00:00Z'),
      h('2026-06-02T10:00:00Z'),
      h('2026-09-01T10:00:00Z'), // future → excluded
      h('2025-12-31T10:00:00Z'), // last year → excluded
    ]
    const out = deriveTrajectoryYear({ history }, now)
    expect(out.map((b) => b.label)).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'])
    expect(out[0].count).toBe(1)
    expect(out[5].count).toBe(1)
    expect(out.reduce((s, b) => s + b.count, 0)).toBe(2)
  })
})
