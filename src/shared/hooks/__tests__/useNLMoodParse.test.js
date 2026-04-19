import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useNLMoodParse } from '../useNLMoodParse'

vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useNLMoodParse', () => {
  it('returns null immediately when freeText is empty', async () => {
    const { result } = renderHook(() => useNLMoodParse())
    let returned
    await act(async () => {
      returned = await result.current.parse('Cozy', '')
    })
    expect(returned).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('returns clamped dial values on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ intensity: 4, pacing: 2, viewingContext: 1, experienceType: 3 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    const { result } = renderHook(() => useNLMoodParse())
    let returned
    await act(async () => {
      returned = await result.current.parse('Cozy', 'something heavy and slow')
    })

    expect(returned).toEqual({ intensity: 4, pacing: 2, viewingContext: 1, experienceType: 3, preferredMoodTags: [], avoidedMoodTags: [], preferredToneTags: [] })
    expect(result.current.loading).toBe(false)
  })

  it('clamps out-of-range values from the model', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        // intensity=7 (clamp→5), pacing=0 (clamp→1), viewingContext=3, experienceType='fast' (NaN→default 3)
        JSON.stringify({ intensity: 7, pacing: 0, viewingContext: 3, experienceType: 'fast' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    const { result } = renderHook(() => useNLMoodParse())
    let returned
    await act(async () => {
      returned = await result.current.parse('Energized', 'loud and chaotic vibes')
    })

    expect(returned).toEqual({ intensity: 5, pacing: 1, viewingContext: 3, experienceType: 3, preferredMoodTags: [], avoidedMoodTags: [], preferredToneTags: [] })
  })

  it('returns null on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useNLMoodParse())
    let returned
    await act(async () => {
      returned = await result.current.parse('Dark', 'something bleak')
    })

    expect(returned).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('returns null on non-200 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Rate limited', { status: 429 })
    )

    const { result } = renderHook(() => useNLMoodParse())
    let returned
    await act(async () => {
      returned = await result.current.parse('Adventurous', 'fast and exciting')
    })

    expect(returned).toBeNull()
  })

  it('returns validated tag arrays from model response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          intensity: 4, pacing: 2, viewingContext: 1, experienceType: 1,
          preferredMoodTags: ['whimsical', 'melancholic', 'INVALID_TAG'],
          avoidedMoodTags: ['gritty'],
          preferredToneTags: ['poetic', 'intimate', 'NOT_A_TONE'],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    const { result } = renderHook(() => useNLMoodParse())
    let returned
    await act(async () => {
      returned = await result.current.parse('Cozy', 'something like Wes Anderson but darker')
    })

    // Invalid tags are filtered out by filterVocab
    expect(returned.preferredMoodTags).toEqual(['whimsical', 'melancholic'])
    expect(returned.avoidedMoodTags).toEqual(['gritty'])
    expect(returned.preferredToneTags).toEqual(['poetic', 'intimate'])
  })

  it('returns null after 3s timeout', async () => {
    vi.useFakeTimers()
    try {
      vi.spyOn(globalThis, 'fetch').mockImplementation(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            options?.signal?.addEventListener('abort', () =>
              reject(new DOMException('The operation was aborted', 'AbortError'))
            )
          })
      )

      const { result } = renderHook(() => useNLMoodParse())
      let returned
      await act(async () => {
        const promise = result.current.parse('Cozy', 'something quiet and warm')
        await vi.advanceTimersByTimeAsync(3001)
        returned = await promise
      })

      expect(returned).toBeNull()
      expect(result.current.loading).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })
})
