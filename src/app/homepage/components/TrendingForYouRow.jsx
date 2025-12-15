// src/app/homepage/components/TrendingForYouRow.jsx
import { TrendingUp } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useTrendingForYou } from '@/shared/hooks/useRecommendations'
import { useStaggeredEnabled } from '@/shared/hooks/useStaggeredEnabled'

/**
 * TrendingForYouRow
 *
 * - Accepts `userId` from HomePage to avoid waiting on internal auth readiness
 * - Keeps a small stagger so Hero + first row can paint first
 */
export default function TrendingForYouRow({
  userId = undefined,
  limit = 20,
  enabled: enabledProp = undefined,
} = {}) {
  const enabledStaggered = useStaggeredEnabled(200)
  const enabled = typeof enabledProp === 'boolean' ? enabledProp : enabledStaggered

  const userIdOverride =
    typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : undefined

  const { data, loading, error } = useTrendingForYou({
    limit,
    enabled,
    userId: userIdOverride,
  })

  return (
    <PersonalizedCarouselRow
      title="Trending this week (for you)"
      movies={data || []}
      loading={loading}
      error={error}
      icon={TrendingUp}
      rowId="trending-for-you"
      placement="trending"
    />
  )
}
