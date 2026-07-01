import { describe, it, expect } from 'vitest'
import {
  deriveYearByMonth, deriveActivity,
  resolveFeatured, resolveSectionVisibility,
} from '../dnaProfileDerivations'

const mk = (id, over = {}) => ({
  movie_id: id, watched_at: over.watched_at || '2026-03-10T20:00:00Z',
  movies: { id, tmdb_id: 1000 + id, title: over.title || `Film ${id}`, director_name: over.director || 'Dir', release_date: over.release_date || '2015-01-01', runtime: 110, mood_tags: ['tense'], tone_tags: ['earnest'], poster_path: over.poster ?? `/p${id}.jpg` },
})

describe('deriveYearByMonth', () => {
  it('buckets the current calendar year by month and NEVER includes future months', () => {
    const now = new Date('2026-06-15T12:00:00Z')
    const history = [
      mk(1, { watched_at: '2026-01-05T10:00:00Z' }),
      mk(2, { watched_at: '2026-06-02T10:00:00Z' }),
      mk(3, { watched_at: '2026-09-01T10:00:00Z' }), // future → excluded
      mk(4, { watched_at: '2025-12-31T10:00:00Z' }), // last year → excluded
    ]
    const out = deriveYearByMonth(history, now)
    expect(out.map((b) => b.label)).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'])
    expect(out[0].count).toBe(1) // Jan
    expect(out[5].count).toBe(1) // Jun
    expect(out.reduce((s, b) => s + b.count, 0)).toBe(2) // future + last-year excluded
  })
})

describe('deriveActivity', () => {
  it('collapses a watch + rating + review of the same film into ONE item', () => {
    const canonical = [mk(1, { watched_at: '2026-03-10T20:00:00Z' })]
    const ratingsByMovieId = new Map([[1, { movie_id: 1, rating: 9, rated_at: '2026-03-10T21:00:00Z', review_text: 'A quiet marvel.' }]])
    const out = deriveActivity({ canonicalHistory: canonical, ratingsByMovieId, lists: [], limit: 12 })
    expect(out).toHaveLength(1)
    expect(out[0].kind).toBe('reviewed')
    expect(out[0].movie.reviewExcerpt).toContain('quiet marvel')
  })
  it('includes list activity and sorts newest first', () => {
    const canonical = [mk(1, { watched_at: '2026-01-01T10:00:00Z' })]
    const lists = [{ id: 'l1', title: 'Quiet films', count: 5, updatedAt: '2026-06-01T10:00:00Z' }]
    const out = deriveActivity({ canonicalHistory: canonical, ratingsByMovieId: new Map(), lists })
    expect(out[0].type).toBe('list') // most recent
    expect(out[1].type).toBe('film')
  })
})

describe('resolveFeatured', () => {
  const history = [mk(1), mk(2), mk(3), mk(4), mk(5)]
  const ratingsByMovieId = new Map([[1, { movie_id: 1, rating: 10 }], [2, { movie_id: 2, rating: 6 }]])

  it('uses curated My Four with the "chosen" label when featuredFilmIds are set', () => {
    const r = resolveFeatured({ dnaProfile: { featuredFilmIds: [3, 4] }, history, ratingsByMovieId })
    expect(r.myFour.curated).toBe(true)
    expect(r.myFour.label).toMatch(/chosen/i)
    expect(r.myFour.films.map((m) => m.id)).toEqual([3, 4])
  })
  it('falls back to top-rated films with an honest "selected" label', () => {
    const r = resolveFeatured({ dnaProfile: {}, history, ratingsByMovieId })
    expect(r.myFour.curated).toBe(false)
    expect(r.myFour.label).toMatch(/selected from your highest-rated/i)
    expect(r.myFour.films[0].id).toBe(1) // rating 10 first
  })
})

describe('resolveSectionVisibility', () => {
  it('owner sees everything', () => {
    expect(resolveSectionVisibility({ visibility: {}, isOwner: true })).toEqual({ films: true, diary: true, reviews: true, lists: true, connections: true, viewingRhythm: true })
  })
  it('visitor sees only sections explicitly made public', () => {
    const out = resolveSectionVisibility({ visibility: { filmsPublic: true, reviewsPublic: true }, isOwner: false })
    expect(out.films).toBe(true)
    expect(out.reviews).toBe(true)
    expect(out.diary).toBe(false)
    expect(out.viewingRhythm).toBe(false)
  })
})
