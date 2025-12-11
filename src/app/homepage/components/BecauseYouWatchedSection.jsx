// src/app/homepage/components/BecauseYouWatchedSection.jsx

import { Heart } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useBecauseYouWatchedRows } from '@/shared/hooks/useRecommendations'

export default function BecauseYouWatchedSection() {
  const { data: rows, loading, error } = useBecauseYouWatchedRows({
    maxSeeds: 2,
    limitPerSeed: 20,
  })

  if (loading && (!rows || rows.length === 0)) {
    return (
      <PersonalizedCarouselRow
        title="Because you watched"
        movies={[]}
        loading={true}
        error={null}
        rowId="because-you-watched"
      />
    )
  }

  if (error) {
    return (
      <PersonalizedCarouselRow
        title="Because you watched"
        movies={[]}
        loading={false}
        error={error}
        rowId="because-you-watched"
      />
    )
  }

  if (!rows || rows.length === 0) {
    return null
  }

  return (
    <section className="space-y-2 sm:space-y-4">
      {rows.map((row, idx) => (
        <PersonalizedCarouselRow
          key={`${row.seedId}-${idx}`}
          title={`Because you loved ${row.seedTitle}`}
          movies={row.movies}
          loading={false}
          error={null}
          icon={Heart}
          rowId={`because-you-watched-${row.seedId}`}
          placement={`because_you_loved`}
        />
      ))}
    </section>
  )
}