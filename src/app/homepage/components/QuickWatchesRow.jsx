// src/app/homepage/components/QuickWatchesRow.jsx
import { Timer } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useQuickWatchesRow } from '@/shared/hooks/useRecommendations'

export default function QuickWatchesRow({
  userId = undefined,
  limit = 20,
  enabled: enabledProp = undefined,
} = {}) {
  const enabled = typeof enabledProp === 'boolean' ? enabledProp : true

  const userIdOverride =
    typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : undefined

  const { data, loading, error } = useQuickWatchesRow({
    limit,
    enabled,
    userId: userIdOverride,
  })

  return (
    <PersonalizedCarouselRow
      title="Under 90 minutes"
      movies={data || []}
      loading={loading}
      error={error}
      icon={Timer}
      rowId="quick-watches"
      placement="quick_watches"
    />
  )
}
