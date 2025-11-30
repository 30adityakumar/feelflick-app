// src/app/homepage/components/MoodCarouselRow.jsx
/**
 * Mood-based carousel with personalization
 * Uses user preferences to customize mood recommendations
 */

import { useMoodRecommendations } from '@/shared/hooks/useRecommendations'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'

export default function MoodCarouselRow({ moodId, moodName, moodEmoji }) {
  const { data, loading, error } = useMoodRecommendations(moodId, { limit: 20 })

  return (
    <PersonalizedCarouselRow
      title={`${moodEmoji} ${moodName}`}
      movies={data}
      loading={loading}
      error={error}
      icon={() => <span className="text-xl">{moodEmoji}</span>}
      rowId={`mood-${moodId}`}
    />
  )
}
