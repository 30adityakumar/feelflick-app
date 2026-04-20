// src/app/homepage/components/TopOfYourTasteRow.jsx
import { Crown } from 'lucide-react'

import PersonalizedCarouselRow from './PersonalizedCarouselRow'

/**
 * Row 2: Films that sit at the top of the user's taste territory.
 *
 * @param {{ data: Object[]|null, loading: boolean }} props
 */
export default function TopOfYourTasteRow({ data, loading }) {
  const films = data || []
  if (!loading && films.length < 6) return null

  return (
    <PersonalizedCarouselRow
      title="Top of your taste"
      movies={films}
      loading={loading}
      icon={Crown}
      rowId="top-of-taste"
      placement="top_of_taste"
    />
  )
}
