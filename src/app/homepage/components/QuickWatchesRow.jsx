// src/app/homepage/components/QuickWatchesRow.jsx
import { Clock } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useQuickWatches } from '@/shared/hooks/useRecommendations'
import { useStaggeredEnabled } from '@/shared/hooks/useStaggeredEnabled'

export default function QuickWatchesRow() {
  const enabled = useStaggeredEnabled(400) // 400ms delay
  const { data, loading, error } = useQuickWatches({ limit: 20, enabled })

  return (
    <PersonalizedCarouselRow
      title="Quick watches (under 90 min)"
      movies={data}
      loading={loading}
      error={error}
      icon={Clock}
      rowId="quick-watches"
      placement="quick_watches"
    />
  )
}