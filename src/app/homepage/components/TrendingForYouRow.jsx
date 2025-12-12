// src/app/homepage/components/TrendingForYouRow.jsx
import { TrendingUp } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useTrendingForYou } from '@/shared/hooks/useRecommendations'
import { useStaggeredEnabled } from '@/shared/hooks/useStaggeredEnabled'

export default function TrendingForYouRow() {
  const enabled = useStaggeredEnabled(200) // 200ms delay
  const { data, loading, error } = useTrendingForYou({ limit: 20, enabled })

  return (
    <PersonalizedCarouselRow
      title="Trending this week (for you)"
      movies={data}
      loading={loading}
      error={error}
      icon={TrendingUp}
      rowId="trending-for-you"
      placement="trending"
    />
  )
}