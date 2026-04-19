// src/app/homepage/components/MoodCoherenceRow.jsx
import { Waves } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useMoodCoherenceRow } from '@/shared/hooks/useRecommendations'

/**
 * MoodCoherenceRow — "More films that feel like what you've been watching"
 * Only renders for engaged users with >= 3 recent mood tags.
 */
export default function MoodCoherenceRow({
  userId = undefined,
  limit = 20,
  enabled = true,
}) {
  const userIdOverride =
    typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : undefined

  const { data, loading, error } = useMoodCoherenceRow({
    limit,
    enabled,
    userId: userIdOverride,
  })

  return (
    <PersonalizedCarouselRow
      title="More films that feel like what you've been watching"
      movies={data || []}
      loading={loading}
      error={error}
      icon={Waves}
      rowId="mood-coherence"
      placement="mood_coherence"
    />
  )
}
