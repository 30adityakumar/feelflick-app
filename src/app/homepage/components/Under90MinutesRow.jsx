// src/app/homepage/components/Under90MinutesRow.jsx
import { Timer } from 'lucide-react'

import PersonalizedCarouselRow from './PersonalizedCarouselRow'

/**
 * Row 4: Full films in under an hour and a half.
 *
 * @param {{ data: Object[]|null, loading: boolean }} props
 */
export default function Under90MinutesRow({ data, loading }) {
  const films = data || []
  if (!loading && films.length < 6) return null

  return (
    <PersonalizedCarouselRow
      title="Under 90 minutes"
      movies={films}
      loading={loading}
      icon={Timer}
      rowId="under-90"
      placement="under_90"
    />
  )
}
