// src/app/homepage/components/SignatureDirectorRow.jsx
import { Film } from 'lucide-react'

import PersonalizedCarouselRow from './PersonalizedCarouselRow'

/**
 * Row 8: Films by user's signature director (>= 15% of history, >= 3 watches).
 * Hides when no qualifying director exists.
 *
 * @param {{ data: { films: Object[], director: string|null }|null, loading: boolean }} props
 */
export default function SignatureDirectorRow({ data, loading }) {
  const director = data?.director
  const films = data?.films || []

  if (!loading && (!director || films.length < 6)) return null

  const title = director ? `More from ${director}` : 'More from your favorites'

  return (
    <PersonalizedCarouselRow
      title={title}
      movies={films}
      loading={loading}
      icon={Film}
      rowId="signature-director"
      placement="signature_director"
    />
  )
}
