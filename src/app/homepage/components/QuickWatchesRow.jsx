// src/app/homepage/components/QuickWatchesRow.jsx

import { Clock } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useQuickWatches } from '@/shared/hooks/useRecommendations'

export default function QuickWatchesRow() {
  const { data, loading, error } = useQuickWatches({ limit: 20 })

  return (
    <PersonalizedCarouselRow
      title="Quick Watches Under 90 Min"
      movies={data}
      loading={loading}
      error={error}
      icon={Clock}
      rowId="quick-watches"
      placement="quick_watches"
    />
  )
}