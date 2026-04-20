// src/app/homepage/components/CriticsSwoonedRow.jsx
import { Award } from 'lucide-react'

import PersonalizedCarouselRow from './PersonalizedCarouselRow'

/**
 * Row 3A: Films the critics championed that didn't hit the mainstream.
 *
 * @param {{ data: Object[]|null, loading: boolean }} props
 */
export default function CriticsSwoonedRow({ data, loading }) {
  const films = data || []
  if (!loading && films.length < 6) return null

  return (
    <PersonalizedCarouselRow
      title="Critics swooned. Audiences shrugged."
      movies={films}
      loading={loading}
      icon={Award}
      rowId="critics-swooned"
      placement="critics_swooned"
    />
  )
}
