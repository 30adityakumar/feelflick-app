// src/app/homepage/components/SlowContemplativeRow.jsx
import { CloudMoon } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useSlowContemplativeRow } from '@/shared/hooks/useRecommendations'

export default function SlowContemplativeRow({
  userId = undefined,
  limit = 20,
  enabled: enabledProp = undefined,
} = {}) {
  const enabled = typeof enabledProp === 'boolean' ? enabledProp : true

  const userIdOverride =
    typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : undefined

  const { data, loading, error } = useSlowContemplativeRow({
    limit,
    enabled,
    userId: userIdOverride,
  })

  return (
    <PersonalizedCarouselRow
      title="A moment of quiet"
      movies={data || []}
      loading={loading}
      error={error}
      icon={CloudMoon}
      rowId="slow-contemplative"
      placement="slow_contemplative"
    />
  )
}
