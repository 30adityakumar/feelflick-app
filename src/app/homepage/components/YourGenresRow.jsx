// src/app/homepage/components/YourGenresRow.jsx
import { Film } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useYourGenresRow } from '@/shared/hooks/useRecommendations'

/**
 * YourGenresRow — "More {GenreName}" row for the user's top preferred genre.
 */
export default function YourGenresRow({
  userId = undefined,
  limit = 20,
  enabled = true,
}) {
  const userIdOverride =
    typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : undefined

  const { data, label, loading, error } = useYourGenresRow({
    limit,
    enabled,
    userId: userIdOverride,
  })

  return (
    <PersonalizedCarouselRow
      title={label || 'Your genre'}
      movies={data || []}
      loading={loading}
      error={error}
      icon={Film}
      rowId="your-genres"
      placement="your_genres"
    />
  )
}
