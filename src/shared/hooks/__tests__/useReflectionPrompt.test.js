import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useReflectionPrompt } from '../useReflectionPrompt'

// Mock import.meta.env so the EF URL is non-null
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

const FALLBACK = 'What stayed with you after the credits?'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useReflectionPrompt', () => {
  it('returns null prompt and loading=false when tmdbId is null', () => {
    const { result } = renderHook(() => useReflectionPrompt(null))
    expect(result.current.prompt).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('fetches and returns the AI prompt on success', async () => {
    const mockPrompt = 'Did the ambiguous ending feel like surrender or survival?'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ prompt: mockPrompt }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const { result } = renderHook(() => useReflectionPrompt(550))

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.prompt).toBe(mockPrompt)
  })

  it('falls back to generic question on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useReflectionPrompt(550))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.prompt).toBe(FALLBACK)
  })

  it('falls back to generic question on non-200 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Internal Server Error', { status: 500 })
    )

    const { result } = renderHook(() => useReflectionPrompt(550))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.prompt).toBe(FALLBACK)
  })

  it('falls back after 3s timeout', async () => {
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

      const { result } = renderHook(() => useReflectionPrompt(550))

      // Advance time + flush pending microtasks inside act
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3001)
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.prompt).toBe(FALLBACK)
    } finally {
      vi.useRealTimers()
    }
  })
})
