import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// ── TMDB/Supabase layer mocks ─────────────────────────────────────────────────
let PROVIDER_MODE = 'found' // 'found' | 'empty' | 'fail'
const fetchCalls = []
const VALID_DETAILS = {
  id: 496243, title: 'Parasite', original_title: 'Parasite', release_date: '2019-05-30',
  runtime: 132, overview: 'A class war.', genres: [{ id: 18, name: 'Drama' }],
  original_language: 'ko', spoken_languages: [], poster_path: '/p.jpg', backdrop_path: '/b.jpg',
  tagline: '', vote_average: 8.5, budget: 0, revenue: 0,
  credits: { cast: [], crew: [{ job: 'Director', name: 'Bong Joon-ho', id: 21684 }] },
  videos: { results: [] }, recommendations: { results: [] }, similar: { results: [] },
}
const providerJson = () => PROVIDER_MODE === 'empty'
  ? { results: {} }
  : { results: { US: { link: 'https://justwatch.com/x', flatrate: [{ provider_id: 8, provider_name: 'Mock Stream', logo_path: '/l.png' }] } } }

vi.mock('@/shared/api/tmdb', () => ({
  getMovieDetails: vi.fn(async () => VALID_DETAILS),
  fetchJson: vi.fn(async (url) => {
    fetchCalls.push(url)
    if (url.includes('/watch/providers')) {
      if (PROVIDER_MODE === 'fail') throw new Error('boom')
      return providerJson()
    }
    if (url.includes('/release_dates')) return { results: [] }
    return {}
  }),
  backdropImg: (p) => p || '', tmdbImg: (p) => p || '',
}))
const sbChain = () => {
  const c = {}
  for (const m of ['select', 'eq', 'not', 'order', 'limit', 'in']) c[m] = vi.fn(() => c)
  c.maybeSingle = vi.fn(async () => ({ data: null, error: null }))
  c.then = (res) => Promise.resolve({ data: [], error: null }).then(res)
  return c
}
vi.mock('@/shared/lib/supabase/client', () => ({ supabase: { from: vi.fn(() => sbChain()) } }))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: null }) }))
vi.mock('@/shared/services/recommendations', () => ({ computeUserProfile: vi.fn(async () => null), scoreMovieForUser: vi.fn(() => null) }))
vi.mock('@/shared/services/matchScore', () => ({ computeMatchPercent: vi.fn(() => null) }))
vi.mock('@/shared/services/movieFields', () => ({ MOVIE_ENGINE_COLS: '*' }))
vi.mock('@/shared/services/boundaries', () => ({ activeMovieBoundaries: () => [], BOUNDARY_LABEL: {} }))
vi.mock('@/shared/lib/format/date', () => ({ formatFullDate: () => '' }))

import { useMovieDataFetch } from '../useMovieData'

beforeEach(() => { PROVIDER_MODE = 'found'; fetchCalls.length = 0; vi.clearAllMocks() })
afterEach(() => vi.clearAllMocks())

const load = async (id = '496243') => {
  const { result } = renderHook(() => useMovieDataFetch(id))
  await waitFor(() => expect(result.current.loading).toBe(false))
  return result
}

describe('useMovieData provider wiring (F5.7)', () => {
  it('11/12. issues exactly ONE provider request, in the initial load', async () => {
    await load()
    expect(fetchCalls.filter((u) => u.includes('/watch/providers')).length).toBe(1)
  })

  it('13. a successful result with offers → status found', async () => {
    PROVIDER_MODE = 'found'
    const r = await load()
    expect(r.current.providerStatus).toBe('found')
    expect(r.current.mv).toBeTruthy()
  })

  it('14. a successful zero-result response → status empty (not error)', async () => {
    PROVIDER_MODE = 'empty'
    const r = await load()
    expect(r.current.providerStatus).toBe('empty')
  })

  it('15/16. a provider failure → status error AND the Film File still loads', async () => {
    PROVIDER_MODE = 'fail'
    const r = await load()
    expect(r.current.providerStatus).toBe('error')
    expect(r.current.error).toBeNull()       // provider failure did NOT fail the route
    expect(r.current.mv).toBeTruthy()        // the page still loaded
  })

  it('17. mapped provider arrays keep their shape', async () => {
    PROVIDER_MODE = 'found'
    const r = await load()
    expect(Array.isArray(r.current.providers.flatrate)).toBe(true)
    expect(r.current.providers.flatrate.length).toBe(1)
    expect(r.current.providers.flatrate[0].name).toBe('Mock Stream')
  })

  it('18. provider status resets to loading for a new id', async () => {
    PROVIDER_MODE = 'found'
    const { result, rerender } = renderHook(({ id }) => useMovieDataFetch(id), { initialProps: { id: '1' } })
    await waitFor(() => expect(result.current.loading).toBe(false))
    rerender({ id: '2' })
    expect(result.current.providerStatus).toBe('loading') // reset via INITIAL_STATE
  })
})
