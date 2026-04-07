import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'

const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockGetHiddenGemsForUser = vi.fn()
const mockGetTrendingForUser = vi.fn()

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: (...args) => mockGetSession(...args),
      onAuthStateChange: (...args) => mockOnAuthStateChange(...args),
    },
  },
}))

vi.mock('@/shared/services/recommendations', async () => {
  const actual = await vi.importActual('@/shared/services/recommendations')
  return {
    ...actual,
    getHiddenGemsForUser: (...args) => mockGetHiddenGemsForUser(...args),
    getTrendingForUser: (...args) => mockGetTrendingForUser(...args),
  }
})

function setupAuthAsGuest() {
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
}

describe('useRecommendations guest fallback rows', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGetSession.mockReset()
    mockOnAuthStateChange.mockReset()
    mockGetHiddenGemsForUser.mockReset()
    mockGetTrendingForUser.mockReset()
    delete globalThis.__feelflick_auth_store_v1__

    setupAuthAsGuest()
    mockGetHiddenGemsForUser.mockResolvedValue([
      { id: 1, tmdb_id: 10, title: 'Hidden Gem', poster_path: '/hidden.jpg' },
    ])
    mockGetTrendingForUser.mockResolvedValue([
      { id: 2, tmdb_id: 20, title: 'Trending Pick', poster_path: '/trend.jpg' },
    ])
  })

  it('still fetches hidden gems when there is no signed-in user', async () => {
    const { useHiddenGems } = await import('./useRecommendations')

    function Probe() {
      const { data, loading } = useHiddenGems()
      return <div>{loading ? 'loading' : `${data.length}`}</div>
    }

    render(<Probe />)

    await waitFor(() => {
      expect(mockGetHiddenGemsForUser).toHaveBeenCalledWith(null, {
        limit: 20,
        excludeIds: [],
      })
    })

  })

  it('still fetches trending recommendations when there is no signed-in user', async () => {
    const { useTrendingForYou } = await import('./useRecommendations')

    function Probe() {
      const { data, loading } = useTrendingForYou()
      return <div>{loading ? 'loading' : `${data.length}`}</div>
    }

    render(<Probe />)

    await waitFor(() => {
      expect(mockGetTrendingForUser).toHaveBeenCalledWith(null, {
        limit: 20,
        excludeIds: [],
      })
    })

  })
})
