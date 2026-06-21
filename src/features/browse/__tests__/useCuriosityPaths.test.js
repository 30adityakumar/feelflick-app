import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// useCuriosityPaths must be honest AND bounded: candidates come from one profile
// read, each candidate is validated by at most ONE lightweight peek, the whole
// thing runs once per user (memoized), order is deterministic, and a path is
// dropped rather than fabricated when its territory is too small.

vi.mock('@/shared/services/recommendations', () => ({ computeUserProfileV3: vi.fn() }))
vi.mock('@/shared/api/browse', () => ({ peekTerritory: vi.fn() }))

import { computeUserProfileV3 } from '@/shared/services/recommendations'
import { peekTerritory } from '@/shared/api/browse'
import { useCuriosityPaths } from '../useCuriosityPaths'

const BIG = { count: 80, posters: ['/p.jpg'] }

beforeEach(() => { vi.clearAllMocks(); peekTerritory.mockResolvedValue(BIG) })

describe('useCuriosityPaths', () => {
  it('cold profile → editorial paths only, one bounded peek per candidate (≤6)', async () => {
    computeUserProfileV3.mockResolvedValue(null)
    const { result } = renderHook(() => useCuriosityPaths('u-cold'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.paths.map(p => p.key)).toEqual(['hidden', 'cult', 'short'])
    expect(result.current.paths.every(p => p.kind === 'editorial')).toBe(true)
    expect(peekTerritory.mock.calls.length).toBe(3)
    expect(peekTerritory.mock.calls.length).toBeLessThanOrEqual(6)
  })

  it('engaged profile → personal paths first, deterministic order, ≤6 peeks total', async () => {
    computeUserProfileV3.mockResolvedValue({
      _legacy: { genres: { preferred: [18] }, languages: { distributionSorted: [{ lang: 'ko' }] } },
      filters: { language_primary: 'ko' },
      affinity: { directors: [{ name: 'Park Chan-wook' }] },
    })
    const { result } = renderHook(() => useCuriosityPaths('u-eng'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.paths.map(p => p.key)).toEqual(['genre', 'language', 'director', 'hidden', 'cult', 'short'])
    expect(result.current.paths.slice(0, 3).every(p => p.kind === 'personal')).toBe(true)
    expect(peekTerritory.mock.calls.length).toBe(6)
  })

  it('drops a path whose territory is too small (renders fewer, never fabricates)', async () => {
    computeUserProfileV3.mockResolvedValue(null)
    peekTerritory.mockResolvedValue({ count: 2, posters: [] })
    const { result } = renderHook(() => useCuriosityPaths('u-thin'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.paths).toEqual([])
  })

  it('memoizes per user — a re-mount neither re-derives nor re-queries', async () => {
    computeUserProfileV3.mockResolvedValue(null)
    const first = renderHook(() => useCuriosityPaths('u-memo'))
    await waitFor(() => expect(first.result.current.loading).toBe(false))
    const callsAfterFirst = peekTerritory.mock.calls.length
    first.unmount()

    const second = renderHook(() => useCuriosityPaths('u-memo'))
    await waitFor(() => expect(second.result.current.loading).toBe(false))
    expect(peekTerritory.mock.calls.length).toBe(callsAfterFirst)
  })
})
