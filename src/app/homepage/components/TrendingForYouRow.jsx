// src/app/homepage/components/TrendingForYouRow.jsx

import { TrendingUp } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useTrendingForYou } from '@/shared/hooks/useRecommendations'

export default function TrendingForYouRow() {
  const { data, loading, error } = useTrendingForYou({ limit: 20 })

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