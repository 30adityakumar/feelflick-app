import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Mock Supabase
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

// Mock computeUserProfile
vi.mock('@/shared/services/recommendations', () => ({
  computeUserProfile: vi.fn(),
}))

import { supabase } from '@/shared/lib/supabase/client'
import { computeUserProfile } from '@/shared/services/recommendations'
import { _resetWeightsCache, useSuggestedMoods } from '../useSuggestedMoods'

function makeWeightsChain(rows) {
  return {
    select: vi.fn().mockReturnValue(
      Promise.resolve({ data: rows, error: null })
    ),
  }
}

function makeProfile(overrides = {}) {
  return {
    genres: { preferred: [28, 12] }, // Action, Adventure
    contentProfile: { avgIntensity: 50, avgPacing: 50 },
    meta: { confidence: 'medium' },
    ...overrides,
  }
}

const ADVENTUROUS_WEIGHTS = [
  { mood_id: 2, genre_id: 12, weight: 1.5 }, // Adventure
  { mood_id: 2, genre_id: 28, weight: 1.2 }, // Action
  { mood_id: 2, genre_id: 14, weight: 1.0 }, // Fantasy
]

beforeEach(() => {
  vi.clearAllMocks()
  _resetWeightsCache()
})

describe('useSuggestedMoods', () => {
  it('returns suggested mood IDs matching user genre preferences', async () => {
    supabase.from.mockReturnValue(makeWeightsChain(ADVENTUROUS_WEIGHTS))
    computeUserProfile.mockResolvedValue(
      makeProfile({
        genres: { preferred: [28, 12] }, // Action + Adventure → match mood 2
        contentProfile: { avgIntensity: 70, avgPacing: 70 }, // high → boost mood 2
      })
    )

    const { result } = renderHook(() =>
      useSuggestedMoods('user-1', 'afternoon', 5) // Friday → +8 for mood 2
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.suggestedMoodIds).toContain(2)
  })

  it('returns empty array for a new user with no confidence', async () => {
    supabase.from.mockReturnValue(makeWeightsChain(ADVENTUROUS_WEIGHTS))
    computeUserProfile.mockResolvedValue(
      makeProfile({ meta: { confidence: 'none' } })
    )

    const { result } = renderHook(() =>
      useSuggestedMoods('user-new', 'evening', 1)
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.suggestedMoodIds).toEqual([])
  })

  it('returns empty array when genre overlap is too low (score < 15)', async () => {
    // Only mood 7 (Musical, genres 10402+18) — user prefers Action(28) and Adventure(12)
    const noOverlapWeights = [
      { mood_id: 7, genre_id: 10402, weight: 2.0 },
      { mood_id: 7, genre_id: 18,    weight: 0.6 },
    ]
    supabase.from.mockReturnValue(makeWeightsChain(noOverlapWeights))
    computeUserProfile.mockResolvedValue(
      makeProfile({
        genres: { preferred: [28, 12] },
        contentProfile: { avgIntensity: 50, avgPacing: 50 },
      })
    )

    const { result } = renderHook(() =>
      useSuggestedMoods('user-1', 'morning', 1) // Monday, no day bonus for mood 7
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.suggestedMoodIds).toEqual([])
  })

  it('does not call computeUserProfile when userId is null', () => {
    const { result } = renderHook(() =>
      useSuggestedMoods(null, 'evening', 3)
    )

    expect(computeUserProfile).not.toHaveBeenCalled()
    expect(result.current.suggestedMoodIds).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('returns empty array on Supabase error (silent fallback)', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
    })
    computeUserProfile.mockResolvedValue(makeProfile())

    const { result } = renderHook(() =>
      useSuggestedMoods('user-1', 'evening', 3)
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.suggestedMoodIds).toEqual([])
  })
})
