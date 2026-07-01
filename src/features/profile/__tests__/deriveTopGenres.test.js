import { describe, it, expect } from 'vitest'
import { deriveTopGenres, MIN_GENRED_FILMS_FOR_GENRE_BARS } from '../derive'

const h = (genre) => ({ movies: { primary_genre: genre } })

describe('deriveTopGenres', () => {
  it('returns null for empty history', () => {
    expect(deriveTopGenres({ history: [] })).toBeNull()
  })

  it('returns null when no row has a genre', () => {
    expect(deriveTopGenres({ history: [h(null), h(undefined), h(''), { movies: {} }] })).toBeNull()
  })

  it('tallies and sorts descending by count', () => {
    const history = [
      ...Array(5).fill(h('Drama')),
      ...Array(3).fill(h('Comedy')),
      h('Horror'),
    ]
    const out = deriveTopGenres({ history })
    expect(out.genres.map((g) => g.genre)).toEqual(['Drama', 'Comedy', 'Horror'])
    expect(out.genres[0]).toMatchObject({ genre: 'Drama', count: 5 })
  })

  it('breaks ties deterministically (alphabetical) and is order-independent', () => {
    const history = [...Array(4).fill(h('Comedy')), ...Array(4).fill(h('Action'))]
    const a = deriveTopGenres({ history })
    const b = deriveTopGenres({ history: [...history].reverse() })
    expect(a).toEqual(b)
    expect(a.genres.map((g) => g.genre)).toEqual(['Action', 'Comedy'])
  })

  it('computes pct against the genred subset, not raw history length', () => {
    const history = [...Array(6).fill(h('Drama')), ...Array(4).fill(h('Comedy')), ...Array(10).fill(h(null))]
    const out = deriveTopGenres({ history })
    expect(out.genredTotal).toBe(10)
    expect(out.genres[0]).toMatchObject({ genre: 'Drama', count: 6, pct: 60 })
    expect(out.genres[1]).toMatchObject({ genre: 'Comedy', count: 4, pct: 40 })
  })

  it('caps at the top 5 distinct genres', () => {
    const genreNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    const history = genreNames.flatMap((g, i) => Array(genreNames.length - i).fill(h(g)))
    const out = deriveTopGenres({ history })
    expect(out.genres).toHaveLength(5)
    expect(out.distinctCount).toBe(7)
  })

  it('is NOT eligible below the sample-size floor, even with 2+ distinct genres', () => {
    const history = [h('Drama'), h('Comedy')]
    const out = deriveTopGenres({ history })
    expect(out.genredTotal).toBeLessThan(MIN_GENRED_FILMS_FOR_GENRE_BARS)
    expect(out.distinctCount).toBe(2)
    expect(out.eligible).toBe(false)
  })

  it('is NOT eligible with only one distinct genre, even above the sample-size floor', () => {
    const history = Array(8).fill(h('Drama'))
    const out = deriveTopGenres({ history })
    expect(out.genredTotal).toBeGreaterThanOrEqual(MIN_GENRED_FILMS_FOR_GENRE_BARS)
    expect(out.distinctCount).toBe(1)
    expect(out.eligible).toBe(false)
  })

  it('is eligible once both the sample-size floor and 2+ distinct genres are met', () => {
    const history = [...Array(4).fill(h('Drama')), ...Array(4).fill(h('Comedy'))]
    const out = deriveTopGenres({ history })
    expect(out.genredTotal).toBe(8)
    expect(out.distinctCount).toBe(2)
    expect(out.eligible).toBe(true)
  })
})
