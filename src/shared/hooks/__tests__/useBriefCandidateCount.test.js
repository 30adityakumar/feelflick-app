import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

import { _resetBaselineCache, useBriefCandidateCount } from '../useBriefCandidateCount'

// Mock supabase
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}))

import { supabase } from '@/shared/lib/supabase/client'

afterEach(() => {
  _resetBaselineCache()
  vi.restoreAllMocks()
})

function mockRpc(returnValue) {
  supabase.rpc.mockResolvedValue({ data: returnValue, error: null })
}

/** Wait for debounce (250ms) + async resolution */
function waitForDebounce() {
  return new Promise((r) => setTimeout(r, 350))
}

describe('useBriefCandidateCount', () => {
  it('fetches baseline total on mount with no filter-relevant answers', async () => {
    mockRpc(4200)

    const { result } = renderHook(() =>
      useBriefCandidateCount({ answers: {} }),
    )

    await waitFor(() => {
      expect(result.current.count).toBe(4200)
      expect(result.current.loading).toBe(false)
    })

    expect(supabase.rpc).toHaveBeenCalledWith('count_brief_candidates', {})
  })

  it('counts again when a filter-relevant answer is set (debounced)', async () => {
    supabase.rpc
      .mockResolvedValueOnce({ data: 4200, error: null })
      .mockResolvedValueOnce({ data: 2800, error: null })

    const { result, rerender } = renderHook(
      ({ brief }) => useBriefCandidateCount(brief),
      { initialProps: { brief: { answers: {} } } },
    )

    await waitFor(() => expect(result.current.count).toBe(4200))

    // Set energy answer
    rerender({ brief: { answers: { energy: 1 } } })

    // Wait for debounce + async
    await act(() => waitForDebounce())

    await waitFor(() => {
      expect(result.current.count).toBe(2800)
      expect(result.current.previousCount).toBe(4200)
    })

    expect(supabase.rpc).toHaveBeenCalledWith('count_brief_candidates', { p_energy: 1 })
  })

  it('maps all filter-relevant answers to RPC params', async () => {
    supabase.rpc
      .mockResolvedValueOnce({ data: 4200, error: null })
      .mockResolvedValueOnce({ data: 150, error: null })

    const answers = {
      feeling: 3,           // excluded — scoring-only
      energy: 5,
      attention: 'lean-in',
      tone: 'sharp',
      time: 'short',
      era: 'modern',
    }

    const { result } = renderHook(() =>
      useBriefCandidateCount({ answers }),
    )

    // Wait for baseline + debounced filter count
    await act(() => waitForDebounce())

    await waitFor(() => expect(result.current.count).toBe(150))

    // Last call should have all filter params but NOT p_mood_id
    const lastCall = supabase.rpc.mock.calls[supabase.rpc.mock.calls.length - 1]
    expect(lastCall[0]).toBe('count_brief_candidates')
    expect(lastCall[1]).toEqual({
      p_energy: 5,
      p_attention: 'lean-in',
      p_tone: 'sharp',
      p_time: 'short',
      p_era: 'modern',
    })
    expect(lastCall[1].p_mood_id).toBeUndefined()
  })
})
