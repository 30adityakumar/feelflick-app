import { describe, expect, it } from 'vitest'
import { logoImg, selectBestLogo } from '../tmdb'

describe('logoImg', () => {
  it('builds an original-size logo URL by default', () => {
    expect(logoImg('/abc.png')).toBe('https://image.tmdb.org/t/p/original/abc.png')
  })
  it('honours an explicit size', () => {
    expect(logoImg('/abc.png', 'w500')).toBe('https://image.tmdb.org/t/p/w500/abc.png')
  })
  it('returns an empty string (not a transparent pixel) for a missing path', () => {
    expect(logoImg('')).toBe('')
    expect(logoImg(null)).toBe('')
    expect(logoImg(undefined)).toBe('')
  })
})

describe('selectBestLogo', () => {
  it('returns null for empty / invalid input', () => {
    expect(selectBestLogo(null)).toBeNull()
    expect(selectBestLogo([])).toBeNull()
    expect(selectBestLogo([{ width: 100 }])).toBeNull() // no file_path
  })

  it('prefers an English logo over a language-neutral one', () => {
    const path = selectBestLogo([
      { file_path: '/neutral.png', iso_639_1: null, vote_average: 9, width: 2000 },
      { file_path: '/english.png', iso_639_1: 'en', vote_average: 1, width: 300 },
    ])
    expect(path).toBe('/english.png')
  })

  it('prefers language-neutral (null) over a non-English language', () => {
    const path = selectBestLogo([
      { file_path: '/french.png', iso_639_1: 'fr', vote_average: 9 },
      { file_path: '/neutral.png', iso_639_1: null, vote_average: 1 },
    ])
    expect(path).toBe('/neutral.png')
  })

  it('prefers PNG over SVG at the same language tier', () => {
    const path = selectBestLogo([
      { file_path: '/vector.svg', iso_639_1: 'en', vote_average: 9, width: 5000 },
      { file_path: '/raster.png', iso_639_1: 'en', vote_average: 5, width: 800 },
    ])
    expect(path).toBe('/raster.png')
  })

  it('breaks ties by vote_average then width', () => {
    const path = selectBestLogo([
      { file_path: '/low.png', iso_639_1: 'en', vote_average: 3, width: 900 },
      { file_path: '/high.png', iso_639_1: 'en', vote_average: 8, width: 400 },
    ])
    expect(path).toBe('/high.png')
  })
})
