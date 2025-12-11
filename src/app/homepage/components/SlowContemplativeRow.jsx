// src/app/homepage/components/SlowContemplativeRow.jsx

import { Coffee } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useSlowContemplative } from '@/shared/hooks/useRecommendations'

export default function SlowContemplativeRow() {
  const { data, loading, error } = useSlowContemplative({ limit: 20 })

  return (
    <PersonalizedCarouselRow
      title="Slow & Contemplative"
      movies={data}
      loading={loading}
      error={error}
      icon={Coffee}
      rowId="slow-contemplative"
      placement="slow_contemplative"
    />
  )
}