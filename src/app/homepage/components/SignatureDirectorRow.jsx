// src/app/homepage/components/SignatureDirectorRow.jsx
import { Film } from 'lucide-react'

import PersonalizedCarouselRow from './PersonalizedCarouselRow'

/**
 * Row 8: Films by user's signature director (day-hash rotated).
 * Shows director photo, name, and "why this director" subtitle.
 *
 * @param {{ data: { films: Object[], director: { name: string, profile_path: string|null }|null, subtitle: string|null }|null, loading: boolean }} props
 */
export default function SignatureDirectorRow({ data, loading }) {
  const director = data?.director
  const films = data?.films || []
  const subtitle = data?.subtitle

  if (!loading && (!director || films.length < 6)) return null

  const directorName = director?.name || 'your favorites'

  const titleNode = (
    <span className="inline-flex items-center gap-2.5">
      {director?.profile_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w92${director.profile_path}`}
          alt={directorName}
          className="h-8 w-8 rounded-full object-cover"
          style={{ border: '1.5px solid rgba(192, 132, 252, 0.3)' }}
        />
      ) : (
        <Film
          aria-hidden="true"
          className="h-[0.95rem] w-[0.95rem] flex-shrink-0"
          style={{ color: 'rgba(192, 132, 252, 0.82)' }}
        />
      )}
      <span className="inline-flex flex-col gap-0.5">
        <span>More from {directorName}</span>
        {subtitle ? (
          <span
            className="text-[0.74rem] font-normal tracking-wide"
            style={{ color: 'rgba(192, 132, 252, 0.52)' }}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  )

  return (
    <PersonalizedCarouselRow
      title={titleNode}
      movies={films}
      loading={loading}
      rowId="signature-director"
      placement="signature_director"
    />
  )
}
