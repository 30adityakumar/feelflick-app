// src/app/homepage/components/MoodRow.jsx
import { Palette } from 'lucide-react'

import PersonalizedCarouselRow from './PersonalizedCarouselRow'

/**
 * Row 6: Films matching the user's dominant recent mood tag.
 * Hides entirely when mood signature is empty.
 *
 * @param {{ data: { films: Object[], dominantMood: string|null }|null, loading: boolean }} props
 */
export default function MoodRow({ data, loading }) {
  const dominantMood = data?.dominantMood
  const films = data?.films || []

  // Hide if no mood signal or no films
  if (!loading && (!dominantMood || films.length < 6)) return null

  const title = dominantMood
    ? `You've been in a ${dominantMood} mood`
    : 'Your mood lately'

  return (
    <PersonalizedCarouselRow
      title={title}
      movies={films}
      loading={loading}
      icon={Palette}
      rowId="mood-row"
      placement="mood_row"
    />
  )
}
