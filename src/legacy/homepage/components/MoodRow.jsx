// src/app/homepage/components/MoodRow.jsx
import { Palette } from 'lucide-react'

import PersonalizedCarouselRow from './PersonalizedCarouselRow'

/**
 * Row 6: Films matching the user's mood/tone profile.
 * Title and subtitle are service-generated from mood/tone tags.
 *
 * @param {{ data: { films: Object[], title: string, subtitle: string|null }|null, loading: boolean }} props
 */
export default function MoodRow({ data, loading, onShuffle }) {
  const films = data?.films || []
  const rowTitle = data?.title

  // Hide if no title signal or not enough films
  if (!loading && (!rowTitle || films.length < 6)) return null

  const titleNode = (
    <span className="inline-flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1.5">
        <Palette
          aria-hidden="true"
          className="h-[0.95rem] w-[0.95rem] flex-shrink-0"
          style={{ color: 'rgba(192, 132, 252, 0.82)' }}
        />
        <span>{rowTitle}</span>
      </span>
      {data?.subtitle ? (
        <span
          className="text-[0.74rem] font-normal tracking-wide"
          style={{ color: 'rgba(192, 132, 252, 0.52)' }}
        >
          {data.subtitle}
        </span>
      ) : null}
    </span>
  )

  return (
    <PersonalizedCarouselRow
      title={titleNode}
      movies={films}
      loading={loading}
      rowId="mood-row"
      placement="mood_row"
      onShuffle={onShuffle}
    />
  )
}
