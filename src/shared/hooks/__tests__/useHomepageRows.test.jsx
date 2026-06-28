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
  computeUserProfileV3: vi.fn().mockResolvedValue({
    rated: { positive_seeds: [], negative_seeds: [] },
    affinity: { fit_profiles: [], directors: [], mood_tags: [], tone_tags: [], genre_combos: [] },
    content_shape: { pacing: null, intensity: null, depth: null },
    negative: { skipped_fit_profiles: new Map(), anti_seeds: [], personal_skipped_ids: new Set() },
    community: { high_skip_rate_ids: new Set() },
    meta: { total_watches: 0, confidence: 'cold' },
    _legacy: {
      watchedMovieIds: [],
      moodSignature: { recentMoodTags: [] },
      qualityProfile: { totalMoviesWatched: 0 },
    },
  }),
}))

// Mock all homepageRows service functions
const mockGetTopOfYourTasteRow = vi.fn().mockResolvedValue({ films: [], subtitle: null })
const mockGetCriticsSwoonedRow = vi.fn().mockResolvedValue([])
const mockGetPeoplesChampionsRow = vi.fn().mockResolvedValue([])
const mockGetStillInOrbitRow = vi.fn().mockResolvedValue({ films: [], seed: null })
const mockGetMoodRow = vi.fn().mockResolvedValue({ films: [], title: 'Films for your mood', subtitle: null, lead: null, kind: 'mood' })
const mockGetHiddenGemsRow = vi.fn().mockResolvedValue({ films: [] })
const mockGetTopGenreRow = vi.fn().mockResolvedValue({ films: [], genre: null })
const mockGetSignatureTonesRow = vi.fn().mockResolvedValue({ films: [], tones: [] })

vi.mock('@/shared/services/homepageRows', () => ({
  getTopOfYourTasteRow: (...args) => mockGetTopOfYourTasteRow(...args),
  getCriticsSwoonedRow: (...args) => mockGetCriticsSwoonedRow(...args),
  getPeoplesChampionsRow: (...args) => mockGetPeoplesChampionsRow(...args),
  getStillInOrbitRow: (...args) => mockGetStillInOrbitRow(...args),
  getMoodRow: (...args) => mockGetMoodRow(...args),
  getHiddenGemsRow: (...args) => mockGetHiddenGemsRow(...args),
  getTopGenreRow: (...args) => mockGetTopGenreRow(...args),
  getSignatureTonesRow: (...args) => mockGetSignatureTonesRow(...args),
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
    </div>
  )
}

describe('useHomepageRows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete globalThis.__feelflick_auth_store_v1__
  })

  it('cold tier enables only the always-on facets (top of taste, hidden gems, top genre)', async () => {
    mockUseUserTier.mockReturnValue({ tier: 'cold', watchCount: 2, loading: false })

    render(<Probe userId="user-cold" />)

    await waitFor(() => {
      expect(mockGetTopOfYourTasteRow).toHaveBeenCalled()
      expect(mockGetHiddenGemsRow).toHaveBeenCalled()
      expect(mockGetTopGenreRow).toHaveBeenCalled()
    })

    // Watch-dependent facets stay off for cold users.
    expect(mockGetStillInOrbitRow).not.toHaveBeenCalled()
    expect(mockGetMoodRow).not.toHaveBeenCalled()
    expect(mockGetSignatureTonesRow).not.toHaveBeenCalled()
  })

  it('warming tier enables the orbit, mood, and signature-tones facets', async () => {
    mockUseUserTier.mockReturnValue({ tier: 'warming', watchCount: 12, loading: false })

    render(<Probe userId="user-warm" />)

    await waitFor(() => {
      expect(mockGetStillInOrbitRow).toHaveBeenCalled()
      expect(mockGetMoodRow).toHaveBeenCalled()
      expect(mockGetSignatureTonesRow).toHaveBeenCalled()
    })
  })

  it('engaged tier enables every facet row', async () => {
    mockUseUserTier.mockReturnValue({ tier: 'engaged', watchCount: 30, loading: false })

    render(<Probe userId="user-engaged" />)

    await waitFor(() => {
      expect(mockGetTopOfYourTasteRow).toHaveBeenCalled()
      expect(mockGetHiddenGemsRow).toHaveBeenCalled()
      expect(mockGetStillInOrbitRow).toHaveBeenCalled()
      expect(mockGetMoodRow).toHaveBeenCalled()
      expect(mockGetTopGenreRow).toHaveBeenCalled()
      expect(mockGetSignatureTonesRow).toHaveBeenCalled()
    })
  })

  it('returns rotation variant A or B based on userId', () => {
    mockUseUserTier.mockReturnValue({ tier: 'engaged', watchCount: 30, loading: false })

    const { getByTestId } = render(<Probe userId="test-user-abc" />)
    const variant = getByTestId('variant').textContent
    expect(['A', 'B']).toContain(variant)
  })
})
