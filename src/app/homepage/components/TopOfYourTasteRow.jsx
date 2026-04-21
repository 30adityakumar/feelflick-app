// src/app/homepage/components/TopOfYourTasteRow.jsx
import { Crown } from 'lucide-react'

import PersonalizedCarouselRow from './PersonalizedCarouselRow'

/**
 * Row 2: Films that sit at the top of the user's taste territory.
 *
 * @param {{ data: Object[]|null, subtitle: string|null, loading: boolean }} props
 */
export default function TopOfYourTasteRow({ data, subtitle, loading }) {
  const films = data || []
  if (!loading && films.length < 6) return null

  const titleNode = (
    <span className="inline-flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1.5">
        <Crown
          aria-hidden="true"
          className="h-[0.95rem] w-[0.95rem] flex-shrink-0"
          style={{ color: 'rgba(192, 132, 252, 0.82)' }}
        />
        <span>Top of your taste</span>
      </span>
      {subtitle ? (
        <span
          className="text-[0.74rem] font-normal tracking-wide"
          style={{ color: 'rgba(192, 132, 252, 0.52)' }}
        >
          {subtitle}
        </span>
      ) : null}
    </span>
  )

  return (
    <PersonalizedCarouselRow
      title={titleNode}
      movies={films}
      loading={loading}
      rowId="top-of-taste"
      placement="top_of_taste"
    />
  )
}
