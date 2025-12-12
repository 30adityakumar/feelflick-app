// src/app/homepage/components/SlowContemplativeRow.jsx
import { Coffee } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useSlowContemplative } from '@/shared/hooks/useRecommendations'
import { useStaggeredEnabled } from '@/shared/hooks/useStaggeredEnabled'

export default function SlowContemplativeRow() {
  const enabled = useStaggeredEnabled(300) // 300ms delay
  const { data, loading, error } = useSlowContemplative({ limit: 20, enabled })

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