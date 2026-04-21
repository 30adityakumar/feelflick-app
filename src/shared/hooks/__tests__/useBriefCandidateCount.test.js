import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

import { _resetBaselineCache, useBriefCandidateCount } from '../useBriefCandidateCount'

// Mock supabase
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}))

// Mock unpackVibe — returns tone from the vibe's QUESTION_SET option
vi.mock('@/shared/services/brief-scoring', () => ({
  unpackVibe: (answers) => {
    const VIBE_MAP = {
      curious_sharp: { feeling: 'curious', tone: 'sharp' },
      curious_warm: { feeling: 'curious', tone: 'warm' },
      cozy_warm: { feeling: 'cozy', tone: 'warm' },
      dark_sharp: { feeling: 'dark', tone: 'sharp' },
      adventurous_any: { feeling: 'adventurous', tone: 'any' },
    }
    return VIBE_MAP[answers.vibe] || { feeling: null, tone: null }
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

    // Set vibe answer (a filter-relevant field)
    rerender({ brief: { answers: { vibe: 'dark_sharp' } } })

    // Wait for debounce + async
    await act(() => waitForDebounce())

    await waitFor(() => {
      expect(result.current.count).toBe(2800)
      expect(result.current.previousCount).toBe(4200)
    })

    // Vibe dark_sharp unpacks to tone: 'sharp'
    expect(supabase.rpc).toHaveBeenCalledWith('count_brief_candidates', { p_tone: 'sharp' })
  })

  it('maps all filter-relevant answers to RPC params', async () => {
    supabase.rpc
      .mockResolvedValueOnce({ data: 4200, error: null })
      .mockResolvedValueOnce({ data: 150, error: null })

    const answers = {
      vibe: 'curious_sharp',      // unpacks to tone: 'sharp'
      attention: 'lean_in',       // maps to 'lean-in'
      time: 'medium',             // maps to 'standard'
      company: 'friends',         // not sent to RPC
    }

    const { result } = renderHook(() =>
      useBriefCandidateCount({ answers }),
    )

    // Wait for baseline + debounced filter count
    await act(() => waitForDebounce())

    await waitFor(() => expect(result.current.count).toBe(150))

    // Last call should have mapped params
    const lastCall = supabase.rpc.mock.calls[supabase.rpc.mock.calls.length - 1]
    expect(lastCall[0]).toBe('count_brief_candidates')
    expect(lastCall[1]).toEqual({
      p_tone: 'sharp',
      p_attention: 'lean-in',
      p_time: 'standard',
    })
    // Company should NOT be in RPC params
    expect(lastCall[1].p_company).toBeUndefined()
  })
})
