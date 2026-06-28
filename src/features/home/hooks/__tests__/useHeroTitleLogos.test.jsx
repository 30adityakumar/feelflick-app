import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const getTitleLogoUrl = vi.fn()
vi.mock('@/shared/api/tmdb', () => ({ getTitleLogoUrl: (...a) => getTitleLogoUrl(...a) }))

import { useHeroTitleLogos } from '../useHeroTitleLogos'

beforeEach(() => { vi.clearAllMocks() })

describe('useHeroTitleLogos', () => {
  it('returns an empty map and fetches nothing when there are no films', () => {
    const { result } = renderHook(() => useHeroTitleLogos([]))
    expect(result.current.size).toBe(0)
    expect(getTitleLogoUrl).not.toHaveBeenCalled()
  })

  it('fetches per hero film and maps internal id → logo URL', async () => {
    getTitleLogoUrl.mockImplementation((tmdbId) => Promise.resolve(`https://logo/${tmdbId}.png`))
    const films = [
      { id: 1, tmdb_id: 101 },
      { id: 2, tmdbId: 202 },
    ]
    const { result } = renderHook(() => useHeroTitleLogos(films))
    await waitFor(() => expect(result.current.size).toBe(2))
    expect(result.current.get(1)).toBe('https://logo/101.png')
    expect(result.current.get(2)).toBe('https://logo/202.png')
    expect(getTitleLogoUrl).toHaveBeenCalledTimes(2)
  })

  it('skips films without a tmdb id and omits films with no logo', async () => {
    getTitleLogoUrl.mockImplementation((tmdbId) =>
      Promise.resolve(tmdbId === 101 ? 'https://logo/101.png' : null))
    const films = [
      { id: 1, tmdb_id: 101 },   // has a logo
      { id: 2, tmdb_id: 102 },   // resolves null → omitted
      { id: 3 },                 // no tmdb id → never fetched
    ]
    const { result } = renderHook(() => useHeroTitleLogos(films))
    await waitFor(() => expect(result.current.size).toBe(1))
    expect(result.current.get(1)).toBe('https://logo/101.png')
    expect(result.current.has(2)).toBe(false)
    expect(result.current.has(3)).toBe(false)
    expect(getTitleLogoUrl).toHaveBeenCalledTimes(2) // only films 1 and 2
  })

  it('is best-effort: a rejected fetch leaves that film absent (no throw)', async () => {
    getTitleLogoUrl.mockImplementation((tmdbId) =>
      tmdbId === 101 ? Promise.resolve('https://logo/101.png') : Promise.reject(new Error('boom')))
    const films = [
      { id: 1, tmdb_id: 101 },
      { id: 2, tmdb_id: 102 },
    ]
    const { result } = renderHook(() => useHeroTitleLogos(films))
    await waitFor(() => expect(result.current.size).toBe(1))
    expect(result.current.get(1)).toBe('https://logo/101.png')
    expect(result.current.has(2)).toBe(false)
  })
})
