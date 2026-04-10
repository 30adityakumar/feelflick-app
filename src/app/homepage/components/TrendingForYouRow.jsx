// src/app/homepage/components/TrendingForYouRow.jsx
import { TrendingUp } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useTrendingForYou } from '@/shared/hooks/useRecommendations'

/**
 * TrendingForYouRow
 *
 * - Accepts `userId` from HomePage to avoid waiting on internal auth readiness
 * - Starts immediately once auth/user resolution is available
 */
export default function TrendingForYouRow({
  userId = undefined,
  limit = 20,
  enabled: enabledProp = undefined,
} = {}) {
  const enabled = typeof enabledProp === 'boolean' ? enabledProp : true

  const userIdOverride =
    typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : undefined

  const { data, loading, error } = useTrendingForYou({
    limit,
    enabled,
    userId: userIdOverride,
  })

  return (
    <PersonalizedCarouselRow
      title="New & noteworthy"
      movies={data || []}
      loading={loading}
      error={error}
      icon={TrendingUp}
      rowId="trending-for-you"
      placement="trending"
    />
  )
}
