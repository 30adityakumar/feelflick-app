import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'

// Mock auth
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}))

// Mock tier hook
const mockUseUserTier = vi.fn()
vi.mock('@/shared/hooks/useRecommendations', () => ({
  useUserTier: (...args) => mockUseUserTier(...args),
}))

// Mock profile
vi.mock('@/shared/services/recommendations', () => ({
  computeUserProfile: vi.fn().mockResolvedValue({
    watchedMovieIds: [],
    moodSignature: { recentMoodTags: [] },
    qualityProfile: { totalMoviesWatched: 0 },
  }),
}))

// Mock all homepage-rows service functions
const mockGetTopOfYourTasteRow = vi.fn().mockResolvedValue([])
const mockGetCriticsSwoonedRow = vi.fn().mockResolvedValue([])
const mockGetPeoplesChampionsRow = vi.fn().mockResolvedValue([])
const mockGetUnder90MinutesRow = vi.fn().mockResolvedValue([])
const mockGetStillInOrbitRow = vi.fn().mockResolvedValue({ films: [], seed: null })
const mockGetMoodRow = vi.fn().mockResolvedValue({ films: [], dominantMood: null })
const mockGetWatchlistRow = vi.fn().mockResolvedValue({ films: [] })
const mockGetSignatureDirectorRow = vi.fn().mockResolvedValue({ films: [], director: null })

vi.mock('@/shared/services/homepage-rows', () => ({
  getTopOfYourTasteRow: (...args) => mockGetTopOfYourTasteRow(...args),
  getCriticsSwoonedRow: (...args) => mockGetCriticsSwoonedRow(...args),
  getPeoplesChampionsRow: (...args) => mockGetPeoplesChampionsRow(...args),
  getUnder90MinutesRow: (...args) => mockGetUnder90MinutesRow(...args),
  getStillInOrbitRow: (...args) => mockGetStillInOrbitRow(...args),
  getMoodRow: (...args) => mockGetMoodRow(...args),
  getWatchlistRow: (...args) => mockGetWatchlistRow(...args),
  getSignatureDirectorRow: (...args) => mockGetSignatureDirectorRow(...args),
}))

import { useHomepageRows } from '../useHomepageRows'

function Probe({ userId }) {
  const rows = useHomepageRows(userId)
  return (
    <div>
      <span data-testid="tier">{rows.tier ?? 'null'}</span>
      <span data-testid="variant">{rows.rotationVariant}</span>
      <span data-testid="orbit-loading">{String(rows.orbit.loading)}</span>
      <span data-testid="mood-loading">{String(rows.mood.loading)}</span>
      <span data-testid="watchlist-loading">{String(rows.watchlist.loading)}</span>
      <span data-testid="director-loading">{String(rows.director.loading)}</span>
    </div>
  )
}

describe('useHomepageRows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete globalThis.__feelflick_auth_store_v1__
  })

  it('cold tier does not enable orbit, mood, or watchlist queries', async () => {
    mockUseUserTier.mockReturnValue({ tier: 'cold', watchCount: 2, loading: false })

    render(<Probe userId="user-cold" />)

    await waitFor(() => {
      // orbit, mood, watchlist should not be loading (disabled)
    })

    // These should NOT have been called since tier is cold
    expect(mockGetStillInOrbitRow).not.toHaveBeenCalled()
    expect(mockGetMoodRow).not.toHaveBeenCalled()
    expect(mockGetWatchlistRow).not.toHaveBeenCalled()
    expect(mockGetSignatureDirectorRow).not.toHaveBeenCalled()
  })

  it('warming tier enables orbit and mood but not watchlist', async () => {
    mockUseUserTier.mockReturnValue({ tier: 'warming', watchCount: 12, loading: false })

    render(<Probe userId="user-warm" />)

    await waitFor(() => {
      expect(mockGetStillInOrbitRow).toHaveBeenCalled()
      expect(mockGetMoodRow).toHaveBeenCalled()
      expect(mockGetSignatureDirectorRow).toHaveBeenCalled()
    })

    expect(mockGetWatchlistRow).not.toHaveBeenCalled()
  })

  it('engaged tier enables all queries including watchlist and director', async () => {
    mockUseUserTier.mockReturnValue({ tier: 'engaged', watchCount: 30, loading: false })

    render(<Probe userId="user-engaged" />)

    await waitFor(() => {
      expect(mockGetStillInOrbitRow).toHaveBeenCalled()
      expect(mockGetMoodRow).toHaveBeenCalled()
      expect(mockGetWatchlistRow).toHaveBeenCalled()
      expect(mockGetSignatureDirectorRow).toHaveBeenCalled()
    })
  })

  it('returns rotation variant A or B based on userId', () => {
    mockUseUserTier.mockReturnValue({ tier: 'engaged', watchCount: 30, loading: false })

    const { getByTestId } = render(<Probe userId="test-user-abc" />)
    const variant = getByTestId('variant').textContent
    expect(['A', 'B']).toContain(variant)
  })
})
