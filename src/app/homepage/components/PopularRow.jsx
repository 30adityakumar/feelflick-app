// src/app/homepage/components/PopularRow.jsx
import { Flame } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { usePopularForColdStart } from '@/shared/hooks/useRecommendations'

/**
 * PopularRow — "Popular on FeelFlick" for cold-start users.
 * Unpersonalized: global trending, no user signal needed.
 */
export default function PopularRow({
  limit = 20,
  enabled = true,
}) {
  const { data, loading, error } = usePopularForColdStart({
    limit,
    enabled,
  })

  return (
    <PersonalizedCarouselRow
      title="Popular on FeelFlick"
      movies={data || []}
      loading={loading}
      error={error}
      icon={Flame}
      rowId="popular-cold-start"
      placement="popular"
    />
  )
}
